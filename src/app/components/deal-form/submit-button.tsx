"use client"

import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"

export function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" disabled={pending} className="shrink-0">
      {pending ? "Analyzing..." : "Validate"}
    </Button>
  )
}
