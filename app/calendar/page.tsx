import { Suspense } from "react"
import CalendarPageLayoutClient from "@/components/calendar/calendar-page-layout-client"
import { LoadingSpinner } from "@/components/shared/loading-spinner"

export default function CalendarPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CalendarPageLayoutClient />
    </Suspense>
  )
}
