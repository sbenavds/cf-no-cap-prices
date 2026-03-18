import { Suspense } from "react"
import { DealForm } from "./components/deal-form"
import { VerdictBadge } from "@/components/deal-card/verdict-badge"
import { CompetitorRow } from "@/components/price-comparison/competitor-row"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
        <Card className="py-2">
          <CardContent className="px-2">
            <DealForm />
          </CardContent>
        </Card>
      </section>

      <Suspense fallback={null}>
        {/* Price Banner — verdict + price + alert row */}
        <section aria-label="Deal result">
          <Card>
            <CardContent className="flex flex-col gap-5">
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

              {/* Alert row — nested card inside price banner */}
              <Card className="bg-background py-3">
                <CardContent className="flex items-center gap-3">
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
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </section>

        {/* Competitor Prices */}
        <section aria-label="Competitor prices">
          <Card>
            <CardHeader className="flex-row items-baseline justify-between pb-0">
              <CardTitle className="text-sm font-medium">Competitor prices</CardTitle>
              <span className="text-xs text-muted-foreground">vs. listed price</span>
            </CardHeader>
            <CardContent>
              <ol className="flex flex-col">
                {deal.competitors.map((c) => (
                  <CompetitorRow key={c.store} competitor={c} targetPrice={deal.targetPrice} />
                ))}
              </ol>
            </CardContent>
          </Card>
        </section>

        {/* AI Analysis */}
        <section aria-label="AI analysis">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span aria-hidden>☆</span>
                AI analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Streaming verdict — wired in issue #21 */}
              <p className="text-sm leading-relaxed">
                Every store we checked has this lower — by $10 to $20. Amazon and Best Buy both
                have it at $179, which has been the going rate for the past few weeks. The listing
                price adds a 6–11% markup over the current market rate. Not a scam, but
                you&apos;re leaving money on the table. Check Amazon first.
              </p>
            </CardContent>
          </Card>
        </section>
      </Suspense>
    </main>
  )
}
