import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CompetitorRow } from "@/components/price-comparison/competitor-row"
import type { DealResult } from "@/types/deal"

interface PriceComparisonProps {
  deal: DealResult
}

export function PriceComparison({ deal }: PriceComparisonProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-baseline justify-between pb-0">
        <CardTitle className="text-sm font-medium">Competitor prices</CardTitle>
        <span className="text-xs text-muted-foreground">vs. listed price</span>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col">
          {deal.competitors.map((c) => (
            <CompetitorRow
              key={c.store}
              competitor={c}
              targetPrice={deal.targetPrice}
            />
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
