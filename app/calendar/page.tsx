import { Suspense } from "react"
import ProtectedRoute from "@/components/auth/protected-route"
import CalendarPageLayoutClient from "@/components/calendar/calendar-page-layout-client"
import LoadingSpinner from "@/components/shared/loading-spinner"

export default function CalendarPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<LoadingSpinner />}>
        <CalendarPageLayoutClient />
      </Suspense>
    </ProtectedRoute>
  )
}
