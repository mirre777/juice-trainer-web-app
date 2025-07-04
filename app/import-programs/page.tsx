import { Suspense } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import ImportProgramsClient from "./ImportProgramsClient"
import LoadingSpinner from "@/components/shared/loading-spinner"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Import Programs | Juice",
  description: "Import workout programs from Google Sheets",
}

export default function ImportProgramsPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <Suspense fallback={<LoadingSpinner />}>
        <ImportProgramsClient />
      </Suspense>
    </ProtectedRoute>
  )
}
