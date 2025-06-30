"use client"

import dynamic from "next/dynamic"
import { LoadingSpinner } from "@/components/shared/loading-spinner"

const ImportProgramsClient = dynamic(() => import("./ImportProgramsClient"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner size="lg" />
    </div>
  ),
})

export function ImportProgramsWrapper() {
  return <ImportProgramsClient />
}

// Default export for backward compatibility
export default ImportProgramsWrapper
