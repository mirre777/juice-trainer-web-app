import { Suspense } from "react"
import ImportProgramsWrapper from "./import-programs-wrapper"
import LoadingSpinner from "@/components/shared/loading-spinner"

export default function ImportProgramsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ImportProgramsWrapper />
    </Suspense>
  )
}
