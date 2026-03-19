"use client"

import { sendHeartbeat } from "@/app/actions/heartbeat"
import { useEffect, useRef, useState, useTransition } from "react"

interface VisitorCounterProps {
  productUrl: string
}

export function VisitorCounter({ productUrl }: VisitorCounterProps) {
  const [count, setCount] = useState<number | null>(null)
  const [, startTransition] = useTransition()
  const sessionId = useRef(crypto.randomUUID())

  useEffect(() => {
    // Recursive startTransition pattern — each beat schedules the next.
    // Avoids setInterval; React marks non-urgent updates as transitions.
    function beat() {
      startTransition(async () => {
        try {
          const result = await sendHeartbeat(productUrl, sessionId.current)
          setCount(result.count)
        } catch {
          // Counter is non-critical — silently ignore failures
        }
        setTimeout(beat, 10_000)
      })
    }

    beat()
  }, [productUrl])

  if (count === null) return null

  return (
    <p className="text-xs text-muted-foreground">
      {count} {count === 1 ? "person" : "people"} viewing this deal
    </p>
  )
}
