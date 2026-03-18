import {
  PRICE_EXTRACTION_SCHEMA,
  isPriceExtraction,
  type PriceExtraction,
} from "@/lib/schemas/price-extraction"

const BR_API = "https://api.cloudflare.com/client/v4/accounts"
const TIMEOUT_MS = 25_000

const EXTRACTION_PROMPT =
  "Extract the product title, current sale price, currency code (ISO 4217), " +
  "store name, and stock availability from this product page. " +
  "Use the listed price — not the original or crossed-out price. " +
  "If the price is not visible, return price as 0."

export type BrowserRenderingResult =
  | { ok: true; data: PriceExtraction }
  | { ok: false; error: string }

export async function scrapeProductPage(
  url: string,
  accountId: string,
  apiToken: string,
  anthropicApiKey: string
): Promise<BrowserRenderingResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(`${BR_API}/${accountId}/browser-rendering/json`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        prompt: EXTRACTION_PROMPT,
        response_format: PRICE_EXTRACTION_SCHEMA,
        custom_ai: [
          // Primary: claude-sonnet for accuracy
          {
            provider: "anthropic",
            model: "claude-sonnet-4-5",
            api_key: anthropicApiKey,
          },
          // Fallback: llama via Workers AI (no additional cost)
          {
            provider: "workers-ai",
            model: "@cf/meta/llama-3.3-70b-instruct",
          },
        ],
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      return { ok: false, error: `Browser Rendering API error ${res.status}: ${text}` }
    }

    const json: unknown = await res.json()

    // The /json endpoint wraps the result in { result: ... }
    const raw = (json as { result?: unknown })?.result ?? json

    if (!isPriceExtraction(raw)) {
      return { ok: false, error: "Unexpected response shape from Browser Rendering API." }
    }

    return { ok: true, data: raw }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, error: "Browser Rendering request timed out." }
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown scraping error.",
    }
  } finally {
    clearTimeout(timer)
  }
}
