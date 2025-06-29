"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

// Import the client component dynamically to prevent SSR issues
const ImportProgramsClient = dynamic(() => import("../../import-programs/ImportProgramsClient"), {
  ssr: false,
  loading: () => (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border rounded-lg">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-96 mb-4" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
})

export default function DemoImportProgramsWrapper() {
  return <ImportProgramsClient />
}
