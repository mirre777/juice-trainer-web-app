import { Suspense } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import ImportProgramsClient from "./ImportProgramsClient"
import LoadingSpinner from "@/components/shared/loading-spinner"

export default function ImportProgramsPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <Suspense fallback={<LoadingSpinner />}>
        <ImportProgramsClient />
      </Suspense>
    </ProtectedRoute>
  )
}
