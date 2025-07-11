import { Suspense } from "react"
import ProtectedRoute from "@/components/auth/protected-route"
import OverviewPageClient from "./OverviewPageClient"
import LoadingSpinner from "@/components/shared/loading-spinner"

export default function OverviewPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<LoadingSpinner />}>
        <OverviewPageClient />
      </Suspense>
    </ProtectedRoute>
  )
}
