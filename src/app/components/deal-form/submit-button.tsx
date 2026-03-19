"use client"

import { Button } from "@/components/ui/button"
import { useFormStatus } from "react-dom"

export function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" disabled={pending} className="shrink-0">
      {pending ? "Analyzing..." : "Validate"}
    </Button>
  )
}
