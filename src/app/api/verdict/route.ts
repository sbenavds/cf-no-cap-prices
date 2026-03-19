import { streamVerdict } from "@/lib/cf/ai"
import type { DealResult } from "@/types/deal"
import { getCloudflareContext } from "@opennextjs/cloudflare"

export const runtime = "edge"

export async function POST(req: Request): Promise<Response> {
  let deal: DealResult
  try {
    deal = (await req.json()) as DealResult
  } catch {
    return new Response("Invalid request body", { status: 400 })
  }

  const { env } = getCloudflareContext()
  const { CF_ACCOUNT_ID, AI_GATEWAY_SLUG, GROQ_API_KEY } = env

  if (!CF_ACCOUNT_ID || !AI_GATEWAY_SLUG || !GROQ_API_KEY) {
    return new Response("AI not configured", { status: 503 })
  }

  try {
    const stream = await streamVerdict(
      {
        productTitle: deal.productTitle,
        targetPrice: deal.targetPrice,
        currency: deal.currency,
        targetStore: deal.targetStore,
        competitors: deal.competitors,
      },
      CF_ACCOUNT_ID,
      AI_GATEWAY_SLUG,
      GROQ_API_KEY
    )

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI error"
    return new Response(message, { status: 502 })
  }
}
