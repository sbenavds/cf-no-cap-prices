/**
 * JSON schema passed as response_format to the Browser Rendering /json endpoint.
 * The AI model extracts structured price data from a product page.
 */
export const PRICE_EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    productTitle: {
      type: "string",
      description: "Full product title as shown on the page",
    },
    price: {
      type: "number",
      description: "Current sale price as a numeric value, no currency symbols",
    },
    currency: {
      type: "string",
      description: "ISO 4217 currency code (e.g. USD, EUR, MXN)",
    },
    store: {
      type: "string",
      description: "Store or retailer name (e.g. Amazon, Walmart, eBay)",
    },
    availability: {
      type: "string",
      description: "Stock status: 'in_stock', 'out_of_stock', or 'unknown'",
      enum: ["in_stock", "out_of_stock", "unknown"],
    },
  },
  required: ["productTitle", "price", "currency", "store", "availability"],
} as const

/** TypeScript type inferred from the schema shape */
export interface PriceExtraction {
  productTitle: string
  price: number
  currency: string
  store: string
  availability: "in_stock" | "out_of_stock" | "unknown"
}

/** Runtime guard — validates a raw object from the /json endpoint */
export function isPriceExtraction(value: unknown): value is PriceExtraction {
  if (typeof value !== "object" || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.productTitle === "string" &&
    typeof v.price === "number" &&
    v.price > 0 &&
    typeof v.currency === "string" &&
    v.currency.length === 3 &&
    typeof v.store === "string" &&
    (v.availability === "in_stock" ||
      v.availability === "out_of_stock" ||
      v.availability === "unknown")
  )
}
