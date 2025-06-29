import { Suspense } from "react"
import CalendarPageLayoutClient from "@/components/calendar/calendar-page-layout-client"
import { Skeleton } from "@/components/ui/skeleton"

function CalendarSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-96" />
    </div>
  )
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <CalendarPageLayoutClient />
    </Suspense>
  )
}
