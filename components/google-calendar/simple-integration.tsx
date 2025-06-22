"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SimpleGoogleCalendarAuthButton } from "./simple-auth-button"

export function SimpleGoogleCalendarIntegration() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Google Calendar Integration</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Connect your Google Calendar to sync your schedule and prevent double-bookings.
          </p>
          <SimpleGoogleCalendarAuthButton />
        </div>
      </CardContent>
    </Card>
  )
}
