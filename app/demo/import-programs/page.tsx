import { Suspense } from "react"
import DemoImportProgramsWrapper from "./demo-import-programs-wrapper"
import LoadingSpinner from "@/components/shared/loading-spinner"

export default function DemoImportProgramsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DemoImportProgramsWrapper />
    </Suspense>
  )
}
