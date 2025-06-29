import { Suspense } from "react"
import ClientsPageLayout from "@/components/clients-page-layout"
import { LoadingSpinner } from "@/components/shared/loading-spinner"

export default function ClientsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ClientsPageLayout />
    </Suspense>
  )
}
