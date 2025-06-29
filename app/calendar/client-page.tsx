"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageLayout } from "@/components/shared/page-layout"
import { useCurrentUser } from "@/hooks/use-current-user"
import CalendarPageLayoutClient from "@/components/calendar/calendar-page-layout-client"
import { Skeleton } from "@/components/ui/skeleton"
import { setLoading } from "@/utils/set-loading" // Import setLoading function

interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  client: string
  type: string
}

// Named export for compatibility
export function ClientCalendarPage() {
  const { user, loading } = useCurrentUser()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isClient, setIsClient] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    setIsClient(true)
    fetchCalendarData()
  }, [])

  const fetchCalendarData = async () => {
    try {
      setLoading(true) // Use the imported setLoading function
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
      setLoading(false) // Use the imported setLoading function
    }
  }

  if (!isClient || loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please log in to view your calendar.</p>
      </div>
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

  return <CalendarPageLayoutClient events={events} isDemo={false} />
}

// Default export for consistency
export default ClientCalendarPage
