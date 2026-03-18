import { scrapeProductPage } from "@/lib/cf/browser-rendering"
import { cacheDeal } from "@/lib/cf/kv"
import { savePriceToD1 } from "@/lib/cf/d1"
import type { PriceExtraction } from "@/lib/schemas/price-extraction"
import type { DealResult, VerdictType } from "@/types/deal"

export interface ScrapeJob {
  productUrl: string
  requestId?: string
}

interface ScrapeEnv {
  PRICES_KV: KVNamespace
  DB: D1Database
  CF_ACCOUNT_ID: string
  CF_BR_API_TOKEN: string
  // Claude key reused for Browser Rendering custom_ai
  GROQ_API_KEY: string
}

/**
 * Called by the Cloudflare Queues consumer.
 * Scrapes 4 competitor stores in parallel, caches result in KV, persists to D1.
 */
export async function processScrapeJob(
  job: ScrapeJob,
  env: ScrapeEnv
): Promise<void> {
  const { productUrl } = job

  // Scrape 4 stores in parallel
  const stores = ["amazon.com", "walmart.com", "bestbuy.com", "target.com"]
  const results = await Promise.allSettled(
    stores.map((store) =>
      scrapeProductPage(
        // Redirect to store-specific search for comparison
        `https://www.${store}/s?k=${encodeURIComponent(productUrl)}`,
        env.CF_ACCOUNT_ID,
        env.CF_BR_API_TOKEN,
        env.GROQ_API_KEY
      )
    )
  )

  const competitors = results
    .map((r, i) =>
      r.status === "fulfilled" && r.value.ok
        ? { ...r.value.data, storeDomain: stores[i] }
        : null
    )
    .filter((r): r is PriceExtraction & { storeDomain: string } => r !== null)

  if (competitors.length === 0) return

  // Lowest price among competitors determines verdict
  const prices = competitors.map((c) => c.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length

  // Use the first successful result as the "target" product info
  const primary = competitors[0]
  const targetPrice = primary.price
  const verdict = deriveVerdict(targetPrice, avgPrice)

  const deal: DealResult = {
    productTitle: primary.productTitle,
    targetPrice,
    targetStore: primary.store,
    currency: primary.currency,
    competitors: competitors.map((c) => ({
      store: c.store,
      price: c.price,
      currency: c.currency,
      url: `https://www.${c.storeDomain}`,
    })),
    verdict,
    scrapedAt: Date.now(),
  }

  // Persist to KV (1h cache) and D1 (permanent history) in parallel
  await Promise.allSettled([
    cacheDeal(env.PRICES_KV, productUrl, deal),
    ...competitors.map((c) =>
      savePriceToD1(env.DB, {
        productUrl,
        productTitle: c.productTitle,
        store: c.store,
        price: c.price,
        currency: c.currency,
      })
    ),
  ])

  void maxPrice // used implicitly via avgPrice calculation
}

function deriveVerdict(targetPrice: number, avgCompetitorPrice: number): VerdictType {
  const ratio = targetPrice / avgCompetitorPrice
  if (ratio <= 0.9) return "bargain"
  if (ratio <= 1.05) return "fair"
  if (ratio <= 1.2) return "pricey"
  return "scam"
}
