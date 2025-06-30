import { Suspense } from "react"
import ImportProgramsClient from "./ImportProgramsClient"
import LoadingSpinner from "@/components/shared/loading-spinner"

export default function ImportProgramsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ImportProgramsClient />
    </Suspense>
  )
}
