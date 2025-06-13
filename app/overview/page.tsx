import type { Metadata } from "next"
import OverviewPageClient from "./OverviewPageClient"
import { ProtectedRoute } from "@/components/auth/protected-route"

export const metadata: Metadata = {
  title: "Dashboard | Juice",
  description: "Your coaching business at a glance",
}

export default function OverviewPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <OverviewPageClient />
    </ProtectedRoute>
  )
}
