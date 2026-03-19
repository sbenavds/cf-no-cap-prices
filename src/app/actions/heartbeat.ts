"use server"

import { getCloudflareContext } from "@opennextjs/cloudflare"

/**
 * Sends a heartbeat to the VisitorCounter Durable Object.
 * Returns the current viewer count for the product.
 */
export async function sendHeartbeat(
  productUrl: string,
  sessionId: string
): Promise<{ count: number }> {
  const { env } = getCloudflareContext()

  // Derive a stable, bounded product ID from the URL
  const productId = btoa(productUrl).slice(0, 64)

  const stub = env.VISITOR_COUNTER.get(env.VISITOR_COUNTER.idFromName(productId))

  const doUrl = new URL("https://do.internal/")
  doUrl.searchParams.set("sid", sessionId)

  const res = await stub.fetch(new Request(doUrl.toString(), { method: "POST" }))

  if (!res.ok) return { count: 0 }

  const data = (await res.json()) as { count: number }
  return { count: data.count }
}
