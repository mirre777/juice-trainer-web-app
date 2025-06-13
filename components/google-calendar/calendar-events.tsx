"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { format, parseISO, isToday, isTomorrow, addDays } from "date-fns"
import { useToast } from "@/components/toast-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock, MapPin, Calendar, User, RefreshCw } from "lucide-react"
import { useGoogleAuth } from "@/lib/client-token-service"

interface CalendarEventsProps {
  selectedCalendars: Set<string>
  days?: number
}

interface CalendarEvent {
  id: string
  summary: string
  description?: string
  location?: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  colorId?: string
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus?: string
  }>
  calendarId: string
  calendarName: string
  calendarColor: string
}

export function CalendarEvents({ selectedCalendars, days = 7 }: CalendarEventsProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { accessToken, isAuthenticated, isLoading: authLoading } = useGoogleAuth()

  const fetchEvents = async () => {
    if (!accessToken || selectedCalendars.size === 0) {
      setEvents([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // First, get all calendar information to match colors and names
      const calendarListResponse = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!calendarListResponse.ok) {
        throw new Error(`Failed to fetch calendar list: ${calendarListResponse.status}`)
      }

      const calendarListData = await calendarListResponse.json()
      const calendarInfo = new Map()

      calendarListData.items.forEach((cal: any) => {
        calendarInfo.set(cal.id, {
          name: cal.summary,
          color: cal.backgroundColor,
        })
      })

      // Calculate time boundaries
      const timeMin = new Date().toISOString()
      const timeMax = addDays(new Date(), days).toISOString()

      // Fetch events from all selected calendars
      const allEvents: CalendarEvent[] = []

      for (const calendarId of selectedCalendars) {
        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        )

        if (!response.ok) {
          console.error(`Failed to fetch events for calendar ${calendarId}: ${response.status}`)
          continue // Skip this calendar but continue with others
        }

        const data = await response.json()

        // Map and add calendar info to each event
        const calendarEvents = data.items
          .filter((item: any) => item.start?.dateTime) // Only include events with a specific time
          .map((item: any) => ({
            ...item,
            calendarId,
            calendarName: calendarInfo.get(calendarId)?.name || calendarId,
            calendarColor: calendarInfo.get(calendarId)?.color || "#4285F4",
          }))

        allEvents.push(...calendarEvents)
      }

      // Sort all events by start time
      allEvents.sort((a, b) => {
        return new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime()
      })

      setEvents(allEvents)
    } catch (err: any) {
      console.error("Error fetching events:", err)
      setError(err.message)
      toast.error({
        title: "Error",
        description: "Failed to load calendar events. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (accessToken && selectedCalendars.size > 0) {
      fetchEvents()
    }
  }, [accessToken, selectedCalendars])

  // Group events by day for better display
  const groupedEvents: Record<string, CalendarEvent[]> = {}

  events.forEach((event) => {
    const date = event.start.dateTime.split("T")[0]
    if (!groupedEvents[date]) {
      groupedEvents[date] = []
    }
    groupedEvents[date].push(event)
  })

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = parseISO(dateString)
    if (isToday(date)) return "Today"
    if (isTomorrow(date)) return "Tomorrow"
    return format(date, "EEEE, MMMM d")
  }

  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Upcoming Events</h3>
          <Skeleton className="h-8 w-20" />
        </div>

        {[1, 2].map((dayIndex) => (
          <div key={dayIndex} className="space-y-4">
            <Skeleton className="h-6 w-32" />

            {[1, 2, 3].map((eventIndex) => (
              <Card key={`${dayIndex}-${eventIndex}`}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Skeleton className="h-12 w-3 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-6 w-3/4" />
                      <div className="flex gap-6">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Please connect your Google Calendar to view upcoming events.</p>
      </div>
    )
  }

  if (selectedCalendars.size === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Please select at least one calendar to view events.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Upcoming Events</h3>
          <Skeleton className="h-8 w-20" />
        </div>

        {[1, 2].map((dayIndex) => (
          <div key={dayIndex} className="space-y-4">
            <Skeleton className="h-6 w-32" />

            {[1, 2, 3].map((eventIndex) => (
              <Card key={`${dayIndex}-${eventIndex}`}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Skeleton className="h-12 w-3 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-6 w-3/4" />
                      <div className="flex gap-6">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">Upcoming Events ({events.length})</h3>
        <button onClick={fetchEvents} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {Object.keys(groupedEvents).length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No upcoming events in the next {days} days.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedEvents).map(([date, dayEvents]) => (
            <div key={date} className="space-y-4">
              <h4 className="font-medium text-gray-700">{formatDate(date)}</h4>

              {dayEvents.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-3 self-stretch rounded-full" style={{ backgroundColor: event.calendarColor }} />
                      <div>
                        <h5 className="font-medium">{event.summary}</h5>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {format(parseISO(event.start.dateTime), "h:mm a")} -
                              {format(parseISO(event.end.dateTime), " h:mm a")}
                            </span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{event.calendarName}</span>
                          </div>
                          {event.attendees && event.attendees.length > 0 && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>
                                {event.attendees.length} attendee{event.attendees.length !== 1 ? "s" : ""}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
