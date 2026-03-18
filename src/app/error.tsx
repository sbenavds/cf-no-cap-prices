"use client"

import { useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-4">
      <Card className="w-full">
        <CardContent className="flex flex-col gap-3 pt-6">
          <p className="text-sm font-medium">Something went wrong</p>
          <p className="text-sm text-muted-foreground">
            {error.message ?? "An unexpected error occurred. Please try again."}
          </p>
          <Button variant="outline" size="sm" onClick={reset} className="self-start">
            Try again
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
