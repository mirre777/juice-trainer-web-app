import type { Metadata } from "next"
import { CalendarPageLayoutClient } from "@/components/calendar/calendar-page-layout-client"
import { ProtectedRoute } from "@/components/auth/protected-route"

export const metadata: Metadata = {
  title: "Calendar | Juice",
  description: "Schedule and manage your coaching sessions",
}

export default function CalendarPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <CalendarPageLayoutClient />
    </ProtectedRoute>
  )
}
