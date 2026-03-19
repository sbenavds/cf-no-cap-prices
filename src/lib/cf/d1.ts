import { nanoid } from "nanoid"

export interface AlertRecord {
  productUrl: string
  thresholdPrice: number
  email: string
}

export async function saveAlert(db: D1Database, record: AlertRecord): Promise<void> {
  await db
    .prepare(
      `INSERT INTO alerts (id, product_url, threshold_price, email)
       VALUES (?, ?, ?, ?)`
    )
    .bind(nanoid(), record.productUrl, record.thresholdPrice, record.email)
    .run()
}

export interface PriceRecord {
  productUrl: string
  productTitle: string
  store: string
  price: number
  currency: string
}

export async function savePriceToD1(db: D1Database, record: PriceRecord): Promise<void> {
  await db
    .prepare(
      `INSERT INTO prices (id, product_url, product_title, store, price, currency, scraped_at)
       VALUES (?, ?, ?, ?, ?, ?, unixepoch())`
    )
    .bind(
      nanoid(),
      record.productUrl,
      record.productTitle,
      record.store,
      record.price,
      record.currency
    )
    .run()
}

export async function getPriceHistory(
  db: D1Database,
  productUrl: string,
  limit = 30
): Promise<PriceRecord[]> {
  const { results } = await db
    .prepare(
      `SELECT product_url, product_title, store, price, currency
       FROM prices WHERE product_url = ?
       ORDER BY scraped_at DESC LIMIT ?`
    )
    .bind(productUrl, limit)
    .all<PriceRecord>()
  return results
}
