import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { VerdictBadge } from "@/components/deal-card/verdict-badge"
import type { DealResult } from "@/types/deal"

interface DealCardProps {
  deal: DealResult
}

export function DealCard({ deal }: DealCardProps) {
  const cheapest = Math.min(...deal.competitors.map((c) => c.price))

  return (
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
          <span className="text-2xl font-light text-muted-foreground">
            {deal.currency === "USD" ? "$" : deal.currency}
          </span>
          <output className="text-6xl font-bold tabular-nums leading-none tracking-tight">
            {deal.targetPrice.toFixed(2)}
          </output>
        </div>

        {/* Alert row */}
        <Card className="bg-background py-3">
          <CardContent className="flex items-center gap-3">
            <Checkbox id="alert-check" />
            <Label
              htmlFor="alert-check"
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              Alert me below
              <span className="text-muted-foreground">$</span>
              <Input
                type="number"
                name="threshold"
                defaultValue={Math.round(cheapest - 1)}
                min="1"
                className="h-7 w-16 bg-transparent px-1 text-sm font-medium tabular-nums shadow-none focus-visible:ring-0 border-0 border-b border-muted-foreground/30 rounded-none focus-visible:border-foreground"
              />
            </Label>
            <span className="ml-auto text-xs text-muted-foreground tabular-nums">
              {/* Visitor count wired in issue #24 */}
              <span className="font-medium text-foreground">—</span> watching
            </span>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}
