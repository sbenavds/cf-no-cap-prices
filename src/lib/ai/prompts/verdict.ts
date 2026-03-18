export interface VerdictPromptInput {
  productTitle: string
  targetPrice: number
  currency: string
  targetStore: string
  competitors: Array<{ store: string; price: number; currency: string }>
}

export const VERDICT_SYSTEM_PROMPT = `You are a no-nonsense price analyst.
Your job is to tell shoppers in plain English whether a deal is real or not.
Be direct, specific, and use the actual numbers. Never use filler phrases like "In conclusion" or "Overall".
2–3 sentences maximum.`

/**
 * Sanitizes a string to prevent prompt injection.
 * Strips control characters and limits length.
 */
function sanitize(value: string, maxLen = 200): string {
  return value.replace(/[^\x20-\x7E]/g, "").slice(0, maxLen).trim()
}

export function buildVerdictPrompt(input: VerdictPromptInput): string {
  const title = sanitize(input.productTitle)
  const store = sanitize(input.targetStore)
  const listed = `${input.currency} ${input.targetPrice.toFixed(2)}`

  const competitorLines = input.competitors
    .map((c) => `  - ${sanitize(c.store)}: ${c.currency} ${c.price.toFixed(2)}`)
    .join("\n")

  return `Product: ${title}
Listed price at ${store}: ${listed}

Competitor prices:
${competitorLines}

Is this a good deal? Give a 2–3 sentence verdict using the actual prices above.`
}
