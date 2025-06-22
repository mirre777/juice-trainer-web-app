"use client"
import dynamic from "next/dynamic"
import { JuiceLayout } from "@/components/juice-layout"

// Dynamically import the schedule page content with SSR disabled
const SchedulePageContent = dynamic(() => import("@/components/schedule-page-content"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="animate-pulse text-center">
        <div className="h-8 w-48 bg-gray-200 rounded mb-4 mx-auto"></div>
        <div className="h-64 w-full max-w-4xl bg-gray-100 rounded"></div>
      </div>
    </div>
  ),
})

export function SchedulePageWrapper() {
  return (
    <JuiceLayout>
      <SchedulePageContent />
    </JuiceLayout>
  )
}
