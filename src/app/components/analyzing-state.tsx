"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function AnalyzingState() {
  const router = useRouter()

  useEffect(() => {
    // Poll every 5s — when the RSC re-renders and KV has a result,
    // this component unmounts and the deal sections appear.
    const id = setInterval(() => router.refresh(), 5_000)
    return () => clearInterval(id)
  }, [router])

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        <Skeleton className="h-16 w-40" />

        <p className="text-xs text-muted-foreground animate-pulse">
          Scanning 4 stores for competitor prices…
        </p>
      </CardContent>
    </Card>
  )
}
