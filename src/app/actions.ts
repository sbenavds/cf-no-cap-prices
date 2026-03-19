"use server"

import { getCachedDeal } from "@/lib/cf/kv"
import { validateProductUrl } from "@/lib/validators/url"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { redirect } from "next/navigation"

export async function validateDeal(formData: FormData): Promise<void> {
  const raw = formData.get("url")
  if (typeof raw !== "string" || !raw) {
    redirect("/?error=URL+is+required")
  }

  const validation = validateProductUrl(raw)
  if (!validation.ok) {
    redirect(`/?error=${encodeURIComponent(validation.error)}`)
  }

  const productUrl = validation.url.toString()
  const encoded = encodeURIComponent(productUrl)
  const { env } = getCloudflareContext()

  // Cache hit — skip the queue entirely
  const cached = await getCachedDeal(env.PRICES_KV, productUrl)
  if (cached) {
    redirect(`/?url=${encoded}`)
  }

  // Cache miss — enqueue scrape (guard against duplicate enqueues)
  const lockKey = `enqueued:${productUrl}`
  const alreadyQueued = await env.PRICES_KV.get(lockKey)
  if (!alreadyQueued) {
    await env.SCRAPE_QUEUE.send({ productUrl })
    // 5-minute lock so rapid re-submits don't spam the queue
    await env.PRICES_KV.put(lockKey, "1", { expirationTtl: 300 })
  }

  redirect(`/?url=${encoded}`)
}
