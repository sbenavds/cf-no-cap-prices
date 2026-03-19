"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { DealResult } from "@/types/deal"
import { useEffect, useState } from "react"

interface AiVerdictProps {
  deal: DealResult
}

export function AiVerdict({ deal }: AiVerdictProps) {
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchVerdict() {
      try {
        const res = await fetch("/api/verdict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(deal),
        })

        if (!res.ok || !res.body) {
          setError("Could not generate analysis.")
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        setLoading(false)

        while (true) {
          const { done, value } = await reader.read()
          if (done || cancelled) break
          setText((prev) => prev + decoder.decode(value, { stream: true }))
        }
      } catch {
        if (!cancelled) setError("Could not generate analysis.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchVerdict()
    return () => {
      cancelled = true
    }
  }, [deal])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span aria-hidden>☆</span>
          AI analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        )}
        {error && <p className="text-sm text-muted-foreground">{error}</p>}
        {text && <p className="text-sm leading-relaxed">{text}</p>}
      </CardContent>
    </Card>
  )
}
