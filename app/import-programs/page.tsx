import dynamic from "next/dynamic"
import { Suspense } from "react"
import ImportProgramsWrapper from "./import-programs-wrapper"
import LoadingSpinner from "@/components/shared/loading-spinner"

// Import the client component dynamically to prevent SSR issues
const ImportProgramsClient = dynamic(() => import("./ImportProgramsClient"), {
  ssr: false,
})

export default function ImportProgramsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ImportProgramsWrapper />
    </Suspense>
  )
}
