import { Badge } from "@/components/ui/badge"
import type { VerdictType } from "@/types/deal"

const VERDICT: Record<
  VerdictType,
  { label: string; variant: "bargain" | "fair" | "pricey" | "scam" }
> = {
  bargain: { label: "BARGAIN", variant: "bargain" },
  fair: { label: "FAIR PRICE", variant: "fair" },
  pricey: { label: "OVERPRICED", variant: "pricey" },
  scam: { label: "SCAM", variant: "scam" },
}

export function VerdictBadge({ verdict }: { verdict: VerdictType }) {
  const { label, variant } = VERDICT[verdict]
  return (
    <Badge
      variant={variant}
      className="shrink-0 px-3 py-1.5 text-xs font-bold tracking-widest uppercase"
    >
      {label}
    </Badge>
  )
}
