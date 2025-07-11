import { Suspense } from "react"
import ImportProgramsClient from "./ImportProgramsClient"
import LoadingSpinner from "@/components/shared/loading-spinner"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function ImportProgramsPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<LoadingSpinner />}>
          <ImportProgramsClient />
        </Suspense>
      </div>
    </ProtectedRoute>
  )
}
