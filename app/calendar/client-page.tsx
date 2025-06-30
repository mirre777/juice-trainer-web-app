"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ComingSoonOverlay } from "@/components/ui/coming-soon-overlay"

export default function ClientCalendarPage() {
  return (
    <div className="container mx-auto p-6 relative">
      <ComingSoonOverlay />
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Calendar</h1>
        </div>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">John Doe - Upper Body</h3>
                  <p className="text-sm text-gray-500">10:00 AM - 11:00 AM</p>
                </div>
                <div className="text-sm text-gray-500">In 2 hours</div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">Sarah Smith - Cardio</h3>
                  <p className="text-sm text-gray-500">2:00 PM - 3:00 PM</p>
                </div>
                <div className="text-sm text-gray-500">In 6 hours</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar View */}
        <Card>
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center font-medium text-gray-500 p-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }, (_, i) => (
                <div key={i} className="aspect-square border rounded-lg p-2 text-sm">
                  {i + 1 <= 31 ? i + 1 : ""}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
