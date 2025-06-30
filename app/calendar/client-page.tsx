"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

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
      const mockEvents: CalendarEvent[] = []

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
      <div className="container mx-auto p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <button onClick={fetchCalendarData} className="px-4 py-2 bg-gray-200 rounded">
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Calendar</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Calendar Coming Soon</h3>
            <p className="text-gray-500 mb-4">Calendar functionality will be available here.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Keep the default export for consistency
export default ClientCalendarPage
