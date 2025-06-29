import type { Metadata } from "next"
import { ClientCalendarPage } from "./client-page"
import { ProtectedRoute } from "@/components/auth/protected-route"

export const metadata: Metadata = {
  title: "Calendar | Juice",
  description: "Schedule and manage your coaching sessions",
}

export default function CalendarPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <ClientCalendarPage />
    </ProtectedRoute>
  )
}
