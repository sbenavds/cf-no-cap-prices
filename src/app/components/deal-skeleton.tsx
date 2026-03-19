import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function DealSkeleton() {
  return (
    <>
      {/* Price banner skeleton */}
      <Card>
        <CardContent className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-6 w-20 rounded-lg" />
          </div>
          <Skeleton className="h-16 w-40" />
          <Card className="bg-background py-3">
            <CardContent className="flex items-center gap-3">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="ml-auto h-3 w-20" />
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Competitor prices skeleton */}
      <Card>
        <CardHeader className="pb-0">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col">
            {["s1", "s2", "s3", "s4"].map((id) => (
              <div
                key={id}
                className="flex items-center justify-between py-3 border-b border-muted last:border-0"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI analysis skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </CardContent>
      </Card>
    </>
  )
}
