"use client"

import { CalendarPageLayout } from "@/components/calendar/calendar-page-layout"
import { ComingSoonOverlay } from "@/components/ui/coming-soon-overlay"

// Named export
export function ClientCalendarPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Remove the UnifiedHeader from here since it's now in the ClientLayout */}

      {/* Wrap the main content with ComingSoonOverlay */}
      <ComingSoonOverlay message="Calendar Integration Coming Soon">
        <main className="container mx-auto px-4 py-8">
          <CalendarPageLayout isDemo={false} />
        </main>
      </ComingSoonOverlay>
    </div>
  )
}

// Keep the default export for consistency
export default ClientCalendarPage
