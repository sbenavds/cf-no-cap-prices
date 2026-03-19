import {
  VERDICT_SYSTEM_PROMPT,
  type VerdictPromptInput,
  buildVerdictPrompt,
} from "@/lib/ai/prompts/verdict"

const GROQ_MODEL = "llama-3.3-70b-versatile"

/**
 * Streams a price verdict from Groq via Cloudflare AI Gateway.
 * Returns a ReadableStream of plain text chunks.
 */
export async function streamVerdict(
  input: VerdictPromptInput,
  accountId: string,
  gatewaySlug: string,
  groqApiKey: string
): Promise<ReadableStream<Uint8Array>> {
  const url = `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewaySlug}/groq/openai/v1/chat/completions`

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${groqApiKey}`,
      "Content-Type": "application/json",
      // AI Gateway caches identical prompts for 1h
      "cf-aig-cache-ttl": "3600",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      stream: true,
      max_tokens: 150,
      messages: [
        { role: "system", content: VERDICT_SYSTEM_PROMPT },
        { role: "user", content: buildVerdictPrompt(input) },
      ],
    }),
  })

  if (!res.ok || !res.body) {
    const msg = await res.text().catch(() => res.statusText)
    throw new Error(`AI Gateway error ${res.status}: ${msg}`)
  }

  // Transform SSE stream → plain text chunks
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()

  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      const text = decoder.decode(chunk, { stream: true })
      for (const line of text.split("\n")) {
        const trimmed = line.trim()
        if (!trimmed.startsWith("data:")) continue
        const data = trimmed.slice(5).trim()
        if (data === "[DONE]") return
        try {
          const json = JSON.parse(data) as {
            choices?: Array<{ delta?: { content?: string } }>
          }
          const content = json.choices?.[0]?.delta?.content
          if (content) controller.enqueue(encoder.encode(content))
        } catch {
          // skip malformed SSE lines
        }
      }
    },
  })

  return res.body.pipeThrough(transform)
}
