import { AlertForm } from "@/app/components/alert-form"
import { VerdictBadge } from "@/components/deal-card/verdict-badge"
import { Card, CardContent } from "@/components/ui/card"
import type { DealResult } from "@/types/deal"

interface DealCardProps {
  deal: DealResult
  productUrl: string
}

export function DealCard({ deal, productUrl }: DealCardProps) {
  const cheapest = Math.min(...deal.competitors.map((c) => c.price))

  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        {/* Product + verdict */}
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium leading-snug line-clamp-2">{deal.productTitle}</p>
          <VerdictBadge verdict={deal.verdict} />
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-light text-muted-foreground">
            {deal.currency === "USD" ? "$" : deal.currency}
          </span>
          <output className="text-6xl font-bold tabular-nums leading-none tracking-tight">
            {deal.targetPrice.toFixed(2)}
          </output>
        </div>

        {/* Alert row */}
        <Card className="bg-background py-3">
          <CardContent>
            <AlertForm
              productUrl={productUrl}
              defaultThreshold={Math.max(1, Math.round(cheapest - 1))}
            />
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}
