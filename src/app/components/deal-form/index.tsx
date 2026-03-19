import { validateDeal } from "@/app/actions"
import { Input } from "@/components/ui/input"
import { Link } from "lucide-react"
import { SubmitButton } from "./submit-button"

export function DealForm({ error }: { error?: string }) {
  return (
    <form action={validateDeal} className="flex w-full flex-col gap-2">
      <div className="flex w-full items-center gap-2">
        <Link className="ml-1 h-4 w-4 shrink-0 text-muted-foreground/50" strokeWidth={1.5} />
        <Input
          name="url"
          type="url"
          placeholder="https://store.com/product..."
          required
          className="h-10 flex-1 bg-transparent text-sm shadow-none focus-visible:ring-0"
        />
        <SubmitButton />
      </div>
      {error && <p className="px-1 text-xs text-destructive">{error}</p>}
    </form>
  )
}
