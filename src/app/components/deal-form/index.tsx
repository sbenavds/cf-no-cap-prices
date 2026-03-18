import { Input } from "@/components/ui/input"
import { validateDeal } from "@/app/actions"
import { SubmitButton } from "./submit-button"

export function DealForm() {
  return (
    <form action={validateDeal} className="flex w-full gap-2">
      <Input
        name="url"
        type="url"
        placeholder="https://store.com/product..."
        required
        className="h-10 flex-1 border-0 bg-transparent text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
      />
      <SubmitButton />
    </form>
  )
}
