import { Suspense } from "react"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { ImportProgramsWrapper } from "./import-programs-wrapper"

export default function ImportProgramsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <ImportProgramsWrapper />
    </Suspense>
  )
}
