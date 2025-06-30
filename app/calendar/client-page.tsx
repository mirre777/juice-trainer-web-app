"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ComingSoonOverlay } from "@/components/ui/coming-soon-overlay"
import { Calendar, Clock, Users } from "lucide-react"

export function ClientCalendarPage() {
  return (
    <div className="container mx-auto p-6 relative">
      <ComingSoonOverlay />
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Calendar</h1>
          </div>
        </div>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">John Doe - Upper Body</h3>
                    <p className="text-sm text-gray-500">10:00 AM - 11:00 AM</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">In 2 hours</div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Sarah Smith - Cardio</h3>
                    <p className="text-sm text-gray-500">2:00 PM - 3:00 PM</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">In 6 hours</div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Mike Johnson - Full Body</h3>
                    <p className="text-sm text-gray-500">4:00 PM - 5:00 PM</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">In 8 hours</div>
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
              {Array.from({ length: 35 }, (_, i) => {
                const day = i + 1
                const hasEvent = [5, 12, 18, 25].includes(day)
                return (
                  <div
                    key={i}
                    className={`aspect-square border rounded-lg p-2 text-sm relative ${
                      hasEvent ? "bg-blue-50 border-blue-200" : ""
                    }`}
                  >
                    {day <= 31 ? day : ""}
                    {hasEvent && <div className="absolute bottom-1 left-1 w-2 h-2 bg-blue-500 rounded-full"></div>}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Default export for consistency
export default ClientCalendarPage
