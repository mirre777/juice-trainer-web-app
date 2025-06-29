import { Suspense } from "react"
import OverviewPageClient from "./OverviewPageClient"
import { LoadingSpinner } from "@/components/shared/loading-spinner"

export default function OverviewPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <OverviewPageClient />
    </Suspense>
  )
}
