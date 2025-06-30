import { Suspense } from "react"
import SettingsPageClient from "./SettingsPageClient"

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="space-y-6">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <SettingsPageClient />
    </Suspense>
  )
}
