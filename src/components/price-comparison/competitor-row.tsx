import { cn } from "@/lib/utils"
import type { CompetitorPrice } from "@/types/deal"

interface CompetitorRowProps {
  competitor: CompetitorPrice
  targetPrice: number
}

export function CompetitorRow({ competitor, targetPrice }: CompetitorRowProps) {
  // % by which listed price exceeds competitor (positive = listed is overpriced)
  const deltaPct = ((targetPrice - competitor.price) / competitor.price) * 100
  const isCheaper = deltaPct > 0.05
  const isSame = Math.abs(deltaPct) <= 0.05

  return (
    <li className="flex items-center justify-between py-3 border-b border-muted last:border-0">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "h-2 w-2 rounded-full shrink-0",
            isCheaper ? "bg-verdict-scam" : isSame ? "bg-muted-foreground" : "bg-verdict-bargain"
          )}
          aria-hidden
        />
        <span className="text-sm">{competitor.store}</span>
      </div>
      <div className="flex items-baseline gap-4">
        <span className="text-sm font-medium tabular-nums">
          ${competitor.price.toFixed(2)}
        </span>
        {!isSame && (
          <span
            className={cn(
              "text-xs font-medium tabular-nums w-14 text-right",
              isCheaper ? "text-verdict-scam" : "text-verdict-bargain"
            )}
          >
            {isCheaper ? "▲" : "▼"} {Math.abs(deltaPct).toFixed(1)}%
          </span>
        )}
      </div>
    </li>
  )
}
