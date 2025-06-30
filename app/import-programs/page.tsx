import { Suspense } from "react"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { ImportProgramsWrapper } from "./import-programs-wrapper"

export default function ImportProgramsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ImportProgramsWrapper />
    </Suspense>
  )
}
