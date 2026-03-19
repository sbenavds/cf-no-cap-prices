"use server"

import { getCachedDeal } from "@/lib/cf/kv"
import { validateProductUrl } from "@/lib/validators/url"
import type { ActionResult } from "@/types/deal"
import { getCloudflareContext } from "@opennextjs/cloudflare"

export async function validateDeal(formData: FormData): Promise<ActionResult> {
  const raw = formData.get("url")
  if (typeof raw !== "string" || !raw) {
    return { status: "error", message: "URL is required." }
  }

  const validation = validateProductUrl(raw)
  if (!validation.ok) {
    return { status: "error", message: validation.error }
  }

  const productUrl = validation.url.toString()
  const { env } = getCloudflareContext()

  // KV cache hit — return immediately
  const cached = await getCachedDeal(env.PRICES_KV, productUrl)
  if (cached) {
    return { status: "cached", deal: cached }
  }

  // Cache miss — enqueue async scrape job
  await env.SCRAPE_QUEUE.send({ productUrl })

  return { status: "queued", productUrl }
}
