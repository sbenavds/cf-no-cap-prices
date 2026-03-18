import { Suspense } from "react"
import { DealForm } from "./components/deal-form"
import { VerdictBadge } from "@/components/deal-card/verdict-badge"
import { CompetitorRow } from "@/components/price-comparison/competitor-row"
import type { DealResult } from "@/types/deal"

// Static mock — replaced by server data in issue #15
const MOCK_DEAL: DealResult = {
  productTitle: "Bose QuietComfort Ultra Earbuds",
  targetPrice: 199.0,
  targetStore: "Amazon",
  currency: "USD",
  competitors: [
    { store: "Amazon", price: 179.0, currency: "USD", url: "#" },
    { store: "Best Buy", price: 179.99, currency: "USD", url: "#" },
    { store: "Walmart", price: 184.0, currency: "USD", url: "#" },
    { store: "Target", price: 189.99, currency: "USD", url: "#" },
  ],
  verdict: "pricey",
  scrapedAt: Date.now(),
}

export default function HomePage() {
  const deal = MOCK_DEAL
  const cheapest = Math.min(...deal.competitors.map((c) => c.price))

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-3 px-4 py-10">
      {/* Header */}
      <header className="flex items-center gap-3 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
          <span className="text-xs font-bold tracking-tight text-background">NC</span>
        </div>
        <span className="font-semibold tracking-tight">NoCapPrices</span>
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          beta
        </span>
      </header>

      <p className="text-sm text-muted-foreground -mt-2 mb-1">
        Paste a product URL. We scan 4 stores and tell you if the price is real.
      </p>

      {/* Input Zone */}
      <section aria-label="Deal validator">
        <div className="surface p-2 flex items-center gap-2">
          <DealForm />
        </div>
      </section>

      <Suspense fallback={null}>
        {/* Price Banner — verdict + price + alert row */}
        <section aria-label="Deal result">
          <div className="surface p-5 flex flex-col gap-5">
            {/* Product + verdict */}
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium leading-snug line-clamp-2">
                {deal.productTitle}
              </p>
              <VerdictBadge verdict={deal.verdict} />
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-1">
              <span className="text-2xl text-muted-foreground font-light">$</span>
              <output className="text-6xl font-bold tabular-nums leading-none tracking-tight">
                {deal.targetPrice.toFixed(2)}
              </output>
            </div>

            {/* Alert row — inside the price banner */}
            <div className="bg-background rounded-xl px-4 py-3 flex items-center gap-3">
              <input
                type="checkbox"
                id="alert-check"
                className="h-4 w-4 rounded accent-foreground cursor-pointer"
              />
              <label
                htmlFor="alert-check"
                className="flex items-center gap-2 text-sm cursor-pointer select-none"
              >
                Alert me below
                <span className="text-muted-foreground">$</span>
                <input
                  type="number"
                  name="threshold"
                  defaultValue={Math.round(cheapest - 1)}
                  min="1"
                  className="w-16 bg-transparent text-sm font-medium tabular-nums outline-none border-b border-muted-foreground/30 focus:border-foreground transition-colors"
                />
              </label>
              <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                <span className="font-medium text-foreground">430</span> watching
              </span>
            </div>
          </div>
        </section>

        {/* Competitor Prices */}
        <section aria-label="Competitor prices">
          <div className="surface p-5">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-sm font-medium">Competitor prices</h2>
              <span className="text-xs text-muted-foreground">vs. listed price</span>
            </div>
            <ol className="flex flex-col">
              {deal.competitors.map((c) => (
                <CompetitorRow key={c.store} competitor={c} targetPrice={deal.targetPrice} />
              ))}
            </ol>
          </div>
        </section>

        {/* AI Analysis */}
        <section aria-label="AI analysis">
          <div className="surface p-5 flex flex-col gap-3">
            <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <span aria-hidden>☆</span>
              AI analysis
            </h2>
            {/* Streaming verdict — wired in issue #21 */}
            <p className="text-sm leading-relaxed">
              Every store we checked has this lower — by $10 to $20. Amazon and Best Buy both have
              it at $179, which has been the going rate for the past few weeks. The listing price
              adds a 6–11% markup over the current market rate. Not a scam, but you&apos;re
              leaving money on the table. Check Amazon first.
            </p>
          </div>
        </section>
      </Suspense>
    </main>
  )
}
