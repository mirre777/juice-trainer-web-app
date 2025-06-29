import { Suspense } from "react"
import OverviewPageClient from "./OverviewPageClient"
import { Skeleton } from "@/components/ui/skeleton"

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Skeleton className="h-80 md:col-span-4" />
        <Skeleton className="h-80 md:col-span-3" />
      </div>
    </div>
  )
}

export default function OverviewPage() {
  return (
    <Suspense fallback={<OverviewSkeleton />}>
      <OverviewPageClient />
    </Suspense>
  )
}
