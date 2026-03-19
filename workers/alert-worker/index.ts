import { EmailMessage } from "cloudflare:email"
import { createMimeMessage } from "mimetext"

interface Env {
  PRICES_KV: KVNamespace
  DB: D1Database
  EMAIL: SendEmail
  ALERT_FROM_EMAIL: string
}

interface AlertRow {
  id: string
  product_url: string
  threshold_price: number
  email: string
}

interface DealResult {
  productTitle: string
  targetPrice: number
  currency: string
  targetStore: string
}

/**
 * Cron handler — runs every hour.
 * For each active alert:
 *   1. Read current price from KV.
 *   2. If price <= threshold: send email via Email Workers.
 *   3. Deactivate the alert (set active = 0).
 */
export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    // Fetch all active alerts in one query
    const { results: alerts } = await env.DB.prepare(
      "SELECT id, product_url, threshold_price, email FROM alerts WHERE active = 1"
    ).all<AlertRow>()

    if (alerts.length === 0) return

    // Group alerts by product_url to minimize KV reads
    const byUrl = new Map<string, AlertRow[]>()
    for (const alert of alerts) {
      const list = byUrl.get(alert.product_url) ?? []
      list.push(alert)
      byUrl.set(alert.product_url, list)
    }

    const triggeredIds: string[] = []

    await Promise.allSettled(
      [...byUrl.entries()].map(async ([productUrl, productAlerts]) => {
        // Read cached price from KV
        const raw = await env.PRICES_KV.get(`price:${productUrl}`, "json")
        const deal = raw as DealResult | null
        if (!deal) return // Price not in cache — skip until next run

        const currentPrice = deal.targetPrice

        for (const alert of productAlerts) {
          if (currentPrice > alert.threshold_price) continue

          // Price is at or below threshold — send email
          await sendAlertEmail(env, {
            to: alert.email,
            productTitle: deal.productTitle,
            currentPrice,
            threshold: alert.threshold_price,
            currency: deal.currency,
            store: deal.targetStore,
            productUrl,
          })

          triggeredIds.push(alert.id)
        }
      })
    )

    if (triggeredIds.length === 0) return

    // Deactivate triggered alerts in a single batch
    const placeholders = triggeredIds.map(() => "?").join(", ")
    await env.DB.prepare(`UPDATE alerts SET active = 0 WHERE id IN (${placeholders})`)
      .bind(...triggeredIds)
      .run()
  },
} satisfies ExportedHandler<Env>

interface EmailPayload {
  to: string
  productTitle: string
  currentPrice: number
  threshold: number
  currency: string
  store: string
  productUrl: string
}

async function sendAlertEmail(env: Env, payload: EmailPayload): Promise<void> {
  const { to, productTitle, currentPrice, threshold, currency, store, productUrl } = payload

  const currencySymbol = currency === "USD" ? "$" : currency
  const subject = `Price alert: ${productTitle} is now ${currencySymbol}${currentPrice.toFixed(2)}`

  const body = [
    "Good news — the price dropped!",
    "",
    `Product: ${productTitle}`,
    `Current price at ${store}: ${currencySymbol}${currentPrice.toFixed(2)}`,
    `Your alert threshold: ${currencySymbol}${threshold.toFixed(2)}`,
    "",
    `View deal: https://nocapprices.com/?url=${encodeURIComponent(productUrl)}`,
    "",
    "— NoCapPrices",
  ].join("\n")

  const msg = createMimeMessage()
  msg.setSender({ name: "NoCapPrices", addr: env.ALERT_FROM_EMAIL })
  msg.setRecipient(to)
  msg.setSubject(subject)
  msg.addMessage({ contentType: "text/plain", data: body })

  await env.EMAIL.send(new EmailMessage(env.ALERT_FROM_EMAIL, to, msg.asRaw()))
}
