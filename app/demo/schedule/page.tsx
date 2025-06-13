"use client"

import dynamic from "next/dynamic"
import LoadingSpinner from "@/components/shared/loading-spinner"

// Import the page content with SSR disabled
const SchedulePage = dynamic(() => import("@/app/demo/schedule/page-content"), {
  ssr: false,
  loading: () => <LoadingSpinner />,
})

export default function SchedulePageWrapper() {
  return <SchedulePage />
}
