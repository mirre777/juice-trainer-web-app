import { Suspense } from "react"
import ImportProgramsClient from "./ImportProgramsClient"
import LoadingSpinner from "@/components/shared/loading-spinner"

export default function ImportProgramsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<LoadingSpinner />}>
        <ImportProgramsClient />
      </Suspense>
    </div>
  )
}
