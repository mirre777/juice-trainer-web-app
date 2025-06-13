"use client"

import dynamic from "next/dynamic"
import LoadingSpinner from "@/components/shared/loading-spinner"

// Dynamically import the component with no SSR
const CalendarPageLayout = dynamic(
  () => import("@/components/calendar/calendar-page-layout").then((mod) => mod.CalendarPageLayout),
  {
    ssr: false,
    loading: () => <LoadingSpinner />,
  },
)

export default function DemoCalendarPage() {
  return <CalendarPageLayout isDemo={true} />
}
