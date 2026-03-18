import type { DealResult } from "@/types/deal"

const PRICE_TTL = 60 * 60 // 1 hour

export function priceKey(productUrl: string) {
  return `price:${productUrl}`
}

export async function getCachedDeal(
  kv: KVNamespace,
  productUrl: string
): Promise<DealResult | null> {
  const raw = await kv.get(priceKey(productUrl), "json")
  return (raw as DealResult | null) ?? null
}

export async function cacheDeal(
  kv: KVNamespace,
  productUrl: string,
  deal: DealResult
): Promise<void> {
  await kv.put(priceKey(productUrl), JSON.stringify(deal), {
    expirationTtl: PRICE_TTL,
  })
}
