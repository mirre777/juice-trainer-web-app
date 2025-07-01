import { Suspense } from "react"
import ClientPage from "./ClientPage"
import { DatabaseDebug } from "@/components/debug/database-debug"

export default function ClientsPage() {
  return (
    <div className="space-y-8">
      <Suspense fallback={<div>Loading...</div>}>
        <ClientPage />
      </Suspense>

      {/* Debug tool - remove this in production */}
      <div className="border-t pt-8">
        <h2 className="text-xl font-bold mb-4">Debug Tools</h2>
        <DatabaseDebug />
      </div>
    </div>
  )
}
