"use client"

import { type AlertActionState, saveAlertAction } from "@/app/actions/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useActionState, useOptimistic, useState } from "react"

interface AlertFormProps {
  productUrl: string
  defaultThreshold: number
}

const idle: AlertActionState = { status: "idle" }

export function AlertForm({ productUrl, defaultThreshold }: AlertFormProps) {
  const [checked, setChecked] = useState(false)
  const [state, formAction, isPending] = useActionState(saveAlertAction, idle)

  // Show "Saved" optimistically before the server confirms
  const [optimisticState, setOptimistic] = useOptimistic<AlertActionState>(state)

  const saved = optimisticState.status === "saved" || state.status === "saved"

  function clientAction(formData: FormData) {
    setOptimistic({ status: "saved" })
    formAction(formData)
  }

  return (
    <form action={clientAction} className="flex flex-col gap-3">
      <input type="hidden" name="productUrl" value={productUrl} />

      {/* Checkbox row */}
      <div className="flex items-center gap-3">
        <Checkbox
          id="alert-check"
          checked={checked}
          onCheckedChange={(v) => setChecked(Boolean(v))}
          disabled={saved}
        />
        <Label htmlFor="alert-check" className="flex items-center gap-2 text-sm cursor-pointer">
          Alert me below
          <span className="text-muted-foreground">$</span>
          <Input
            type="number"
            name="threshold"
            defaultValue={defaultThreshold}
            min="1"
            step="0.01"
            disabled={saved || !checked}
            className="h-7 w-16 bg-transparent px-1 text-sm font-medium tabular-nums shadow-none focus-visible:ring-0 border-0 border-b border-muted-foreground/30 rounded-none focus-visible:border-foreground"
          />
        </Label>

        {saved && <span className="ml-auto text-xs text-muted-foreground">✓ Alert saved</span>}
      </div>

      {/* Email + submit — only visible when checkbox is checked and not yet saved */}
      {checked && !saved && (
        <div className="flex items-center gap-2">
          <Input
            type="email"
            name="email"
            placeholder="your@email.com"
            required
            className="h-8 text-sm"
          />
          <Button type="submit" size="sm" disabled={isPending} className="shrink-0">
            {isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      )}

      {/* Error message */}
      {optimisticState.status === "error" && (
        <p className="text-xs text-destructive">{optimisticState.message}</p>
      )}
    </form>
  )
}
