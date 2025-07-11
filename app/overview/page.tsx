import { Suspense } from "react"
import OverviewPageClient from "./OverviewPageClient"
import LoadingSpinner from "@/components/shared/loading-spinner"
import { ProtectedRoute } from "@/components/auth/protected-route"

export const metadata = {
  title: "Overview | Juice",
  description: "Your coaching dashboard overview",
}

export default function OverviewPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <Suspense fallback={<LoadingSpinner />}>
        <OverviewPageClient />
      </Suspense>
    </ProtectedRoute>
  )
}
