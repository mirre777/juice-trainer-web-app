"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Users, Plus } from "lucide-react"
import { PageLayout } from "@/components/shared/page-layout"

interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  client: string
  type: string
}

// Named export
export function ClientCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchCalendarData()
  }, [])

  const fetchCalendarData = async () => {
    try {
      setLoading(true)
      setError(null)

      // For now, we'll use mock data since calendar API might not be implemented
      // TODO: Replace with actual API call when calendar endpoints are ready
      const mockEvents: CalendarEvent[] = [
        {
          id: "1",
          title: "Personal Training Session",
          date: "2025-01-02",
          time: "10:00 AM",
          client: "John Doe",
          type: "training",
        },
        {
          id: "2",
          title: "Consultation",
          date: "2025-01-02",
          time: "2:00 PM",
          client: "Jane Smith",
          type: "consultation",
        },
      ]

      setEvents(mockEvents)
    } catch (err) {
      console.error("Error fetching calendar data:", err)
      setError(err instanceof Error ? err.message : "Failed to load calendar")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <PageLayout title="Calendar" description="Schedule and manage your coaching sessions">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="animate-pulse h-8 bg-gray-200 rounded w-32"></div>
            <div className="animate-pulse h-10 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </PageLayout>
    )
  }

  if (error) {
    return (
      <PageLayout title="Calendar" description="Schedule and manage your coaching sessions">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">Error: {error}</p>
              <Button onClick={fetchCalendarData} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="Calendar" description="Schedule and manage your coaching sessions">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">Calendar</h2>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Event
          </Button>
        </div>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No events today</h3>
                <p className="text-gray-500 mb-4">Your schedule is clear for today.</p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Session
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Clock className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{event.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {event.time}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {event.client}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calendar View */}
        <Card>
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Calendar Integration</h3>
              <p className="text-gray-500 mb-4">Full calendar view will be available here.</p>
              <Button variant="outline">View Full Calendar</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}

// Keep the default export for consistency
export default ClientCalendarPage
