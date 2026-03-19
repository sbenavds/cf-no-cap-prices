/**
 * Scraper Worker — Cloudflare Queue consumer
 *
 * Receives scrape jobs, uses Browser Rendering API to extract prices
 * from the target URL + 3 competitor search pages, then writes the
 * DealResult to KV (1h cache) and D1 (permanent history).
 */

import { nanoid } from "nanoid"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Env {
  PRICES_KV: KVNamespace
  DB: D1Database
  CF_ACCOUNT_ID: string
  CF_BR_API_TOKEN: string
}

interface ScrapeJob {
  productUrl: string
}

interface PriceExtraction {
  productTitle: string
  price: number
  currency: string
  store: string
  availability: "in_stock" | "out_of_stock" | "unknown"
}

interface CompetitorPrice {
  store: string
  price: number
  currency: string
  url: string
}

interface DealResult {
  productTitle: string
  targetPrice: number
  targetStore: string
  currency: string
  competitors: CompetitorPrice[]
  verdict: "bargain" | "fair" | "pricey" | "scam"
  scrapedAt: number
}

// ─── Browser Rendering ────────────────────────────────────────────────────────

const BR_API = "https://api.cloudflare.com/client/v4/accounts"
const TIMEOUT_MS = 28_000

const EXTRACTION_PROMPT =
  "Extract the product title, current sale price, currency code (ISO 4217), " +
  "store name, and stock availability from this product page. " +
  "Use the listed price — not the original or crossed-out price. " +
  "If the price is not visible, return price as 0."

const RESPONSE_FORMAT = {
  type: "object",
  properties: {
    productTitle: { type: "string", description: "Full product title as shown on the page" },
    price: { type: "number", description: "Current sale price as a numeric value, no symbols" },
    currency: { type: "string", description: "ISO 4217 currency code (e.g. USD, EUR, MXN)" },
    store: { type: "string", description: "Store or retailer name (e.g. Amazon, Walmart)" },
    availability: {
      type: "string",
      description: "Stock status",
      enum: ["in_stock", "out_of_stock", "unknown"],
    },
  },
  required: ["productTitle", "price", "currency", "store", "availability"],
}

function isPriceExtraction(v: unknown): v is PriceExtraction {
  if (typeof v !== "object" || v === null) return false
  const o = v as Record<string, unknown>
  return (
    typeof o.productTitle === "string" &&
    typeof o.price === "number" &&
    o.price > 0 &&
    typeof o.currency === "string" &&
    o.currency.length === 3 &&
    typeof o.store === "string" &&
    (o.availability === "in_stock" ||
      o.availability === "out_of_stock" ||
      o.availability === "unknown")
  )
}

async function scrape(
  url: string,
  accountId: string,
  apiToken: string
): Promise<PriceExtraction | null> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(`${BR_API}/${accountId}/browser-rendering/json`, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        prompt: EXTRACTION_PROMPT,
        response_format: RESPONSE_FORMAT,
      }),
    })

    if (!res.ok) return null

    const json = (await res.json()) as { result?: unknown }
    const raw = json?.result ?? json
    return isPriceExtraction(raw) ? raw : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

// ─── Verdict ──────────────────────────────────────────────────────────────────

function deriveVerdict(
  targetPrice: number,
  avgCompetitorPrice: number
): "bargain" | "fair" | "pricey" | "scam" {
  const ratio = targetPrice / avgCompetitorPrice
  if (ratio <= 0.9) return "bargain"
  if (ratio <= 1.05) return "fair"
  if (ratio <= 1.2) return "pricey"
  return "scam"
}

// ─── Queue handler ────────────────────────────────────────────────────────────

export default {
  async queue(batch: MessageBatch<ScrapeJob>, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      await processJob(msg.body, env)
      msg.ack()
    }
  },
} satisfies ExportedHandler<Env>

async function processJob(job: ScrapeJob, env: Env): Promise<void> {
  const { productUrl } = job
  const { CF_ACCOUNT_ID: accountId, CF_BR_API_TOKEN: apiToken } = env

  // Step 1: Scrape the target product URL
  const primary = await scrape(productUrl, accountId, apiToken)
  if (!primary) {
    console.log(`[scraper] Failed to scrape ${productUrl}`)
    return
  }

  // Step 2: Build competitor search URLs using the product title
  const q = encodeURIComponent(primary.productTitle)
  const competitorUrls: Array<{ store: string; url: string }> = [
    { store: "Walmart", url: `https://www.walmart.com/search?q=${q}` },
    { store: "Best Buy", url: `https://www.bestbuy.com/site/searchpage.jsp?st=${q}` },
    { store: "Target", url: `https://www.target.com/s?searchTerm=${q}` },
  ]

  // Step 3: Scrape competitors in parallel
  const competitorResults = await Promise.allSettled(
    competitorUrls.map(({ url }) => scrape(url, accountId, apiToken))
  )

  const competitors: CompetitorPrice[] = []
  for (let i = 0; i < competitorResults.length; i++) {
    const result = competitorResults[i]
    if (result.status === "fulfilled" && result.value) {
      competitors.push({
        store: competitorUrls[i].store,
        price: result.value.price,
        currency: result.value.currency,
        url: competitorUrls[i].url,
      })
    }
  }

  if (competitors.length === 0) {
    console.log(`[scraper] No competitor data for ${productUrl}`)
    return
  }

  const avgCompetitorPrice = competitors.reduce((sum, c) => sum + c.price, 0) / competitors.length

  const deal: DealResult = {
    productTitle: primary.productTitle,
    targetPrice: primary.price,
    targetStore: primary.store,
    currency: primary.currency,
    competitors,
    verdict: deriveVerdict(primary.price, avgCompetitorPrice),
    scrapedAt: Date.now(),
  }

  // Step 4: Persist in parallel — KV (1h) + D1 (permanent)
  await Promise.allSettled([
    env.PRICES_KV.put(`price:${productUrl}`, JSON.stringify(deal), { expirationTtl: 3600 }),
    // Remove the enqueue lock so a fresh re-submit works after cache expires
    env.PRICES_KV.delete(`enqueued:${productUrl}`),
    savePriceRows(env.DB, productUrl, primary, competitors),
  ])

  console.log(`[scraper] Done: ${primary.productTitle} → ${deal.verdict} @ $${primary.price}`)
}

async function savePriceRows(
  db: D1Database,
  productUrl: string,
  primary: PriceExtraction,
  competitors: CompetitorPrice[]
): Promise<void> {
  const rows = [
    { store: primary.store, price: primary.price, currency: primary.currency },
    ...competitors.map((c) => ({ store: c.store, price: c.price, currency: c.currency })),
  ]

  await Promise.allSettled(
    rows.map((r) =>
      db
        .prepare(
          `INSERT INTO prices (id, product_url, product_title, store, price, currency, scraped_at)
           VALUES (?, ?, ?, ?, ?, ?, unixepoch())`
        )
        .bind(nanoid(), productUrl, primary.productTitle, r.store, r.price, r.currency)
        .run()
    )
  )
}
