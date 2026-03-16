export type VerdictType = "bargain" | "fair" | "pricey" | "scam"

export interface CompetitorPrice {
  store: string
  price: number
  currency: string
  url: string
}

export interface DealResult {
  productTitle: string
  targetPrice: number
  targetStore: string
  currency: string
  competitors: CompetitorPrice[]
  verdict: VerdictType
  scrapedAt: number
}

export interface PriceAlert {
  id: string
  productUrl: string
  thresholdPrice: number
  email: string
  active: boolean
  createdAt: number
}
