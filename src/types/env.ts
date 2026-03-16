/**
 * Cloudflare bindings available via getCloudflareContext().env
 * Keep in sync with wrangler.jsonc and run `pnpm cf-typegen` after changes.
 */
export interface Env {
  // KV — price cache (1h TTL) + form drafts (24h TTL)
  PRICES_KV: KVNamespace

  // D1 — price history + alerts
  DB: D1Database

  // Queues — async scrape jobs
  SCRAPE_QUEUE: Queue

  // Durable Objects — per-product visitor counter
  VISITOR_COUNTER: DurableObjectNamespace

  // Workers AI — verdict streaming via AI Gateway
  AI: Ai

  // Secrets (wrangler secret put)
  ANTHROPIC_API_KEY: string
  CF_ACCOUNT_ID: string
  CF_BR_API_TOKEN: string
  AI_GATEWAY_SLUG: string
}
