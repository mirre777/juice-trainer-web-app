import { Suspense } from "react"
import ClientPage from "./ClientPage"
import { LoadingSpinner } from "@/components/shared/loading-spinner"

export default function Page() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ClientPage />
    </Suspense>
  )
}
