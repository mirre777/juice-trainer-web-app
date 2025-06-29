import { Suspense } from "react"
import ImportProgramsClient from "../../import-programs/ImportProgramsClient"
import LoadingSpinner from "@/components/shared/loading-spinner"

export default function DemoImportProgramsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ImportProgramsClient />
    </Suspense>
  )
}
