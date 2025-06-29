import dynamic from "next/dynamic"
import { Suspense } from "react"
import DemoImportProgramsWrapper from "./demo-import-programs-wrapper"
import LoadingSpinner from "@/components/shared/loading-spinner"

// Import the client component dynamically to prevent SSR issues
const ImportProgramsClient = dynamic(() => import("../../import-programs/ImportProgramsClient"), {
  ssr: false,
})

export default function DemoImportProgramsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DemoImportProgramsWrapper />
    </Suspense>
  )
}
