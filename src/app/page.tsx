import { Card, CardContent } from "@/components/ui/card"
import { getCachedDeal } from "@/lib/cf/kv"
import type { DealResult } from "@/types/deal"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { Suspense } from "react"
import { AiVerdict } from "./components/ai-verdict"
import { DealCard } from "./components/deal-card"
import { DealForm } from "./components/deal-form"
import { DealSkeleton } from "./components/deal-skeleton"
import { PriceComparison } from "./components/price-comparison"
import { VisitorCounter } from "./components/visitor-counter"

interface PageProps {
  searchParams: Promise<{ url?: string }>
}

// Async child — awaits the deal promise inside Suspense so the page streams
async function DealSection({
  dealPromise,
  productUrl,
}: {
  dealPromise: Promise<DealResult | null>
  productUrl: string
}) {
  const deal = await dealPromise
  if (!deal) return null

  return (
    <>
      <section aria-label="Deal result">
        <DealCard deal={deal} />
      </section>

      <section aria-label="Competitor prices">
        <PriceComparison deal={deal} />
      </section>

      <section aria-label="AI analysis">
        <AiVerdict deal={deal} />
      </section>

      <VisitorCounter productUrl={productUrl} />
    </>
  )
}

export default async function HomePage({ searchParams }: PageProps) {
  const { url } = await searchParams
  const { env } = getCloudflareContext()

  // Create promise without awaiting — passed to DealSection inside Suspense
  const dealPromise: Promise<DealResult | null> = url
    ? getCachedDeal(env.PRICES_KV, url)
    : Promise.resolve(null)

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-3 px-4 py-10">
      {/* Header */}
      <header className="flex items-center gap-3 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
          <span className="text-xs font-bold tracking-tight text-background">NC</span>
        </div>
        <span className="font-semibold tracking-tight">NoCapPrices</span>
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">beta</span>
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

      {/* Result Zone — streams in behind Suspense */}
      {url && (
        <Suspense fallback={<DealSkeleton />}>
          <DealSection dealPromise={dealPromise} productUrl={url} />
        </Suspense>
      )}
    </main>
  )
}
