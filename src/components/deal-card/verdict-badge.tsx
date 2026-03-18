import { cn } from "@/lib/utils"
import type { VerdictType } from "@/types/deal"

const VERDICT: Record<VerdictType, { label: string; className: string }> = {
  bargain: {
    label: "BARGAIN",
    className: "text-verdict-bargain bg-verdict-bargain/10",
  },
  fair: {
    label: "FAIR PRICE",
    className: "text-verdict-fair bg-verdict-fair/10",
  },
  pricey: {
    label: "OVERPRICED",
    className: "text-verdict-pricey bg-verdict-pricey/10",
  },
  scam: {
    label: "SCAM",
    className: "text-verdict-scam bg-verdict-scam/10",
  },
}

export function VerdictBadge({ verdict }: { verdict: VerdictType }) {
  const { label, className } = VERDICT[verdict]
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-lg px-3 py-1.5 text-xs font-bold tracking-widest uppercase",
        className
      )}
    >
      {label}
    </span>
  )
}
