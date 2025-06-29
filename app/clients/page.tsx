import { Suspense } from "react"
import ClientsPageLayout from "@/components/clients-page-layout"
import { Skeleton } from "@/components/ui/skeleton"

function ClientsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </div>
  )
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<ClientsSkeleton />}>
      <ClientsPageLayout />
    </Suspense>
  )
}
