"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, MapPin } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { SessionCard } from "@/components/calendar/session-card"
import { format } from "date-fns"

type CalendarEvent = {
  id: string
  title: string
  start: Date
  end: Date
  client?: string
  clientInitials?: string
  location?: string
  type?: string
  source?: "local" | "google"
  duration?: number
}

export function CalendarListView({
  events = [],
  isLoading = false,
  onEventClick,
}: {
  events: CalendarEvent[]
  isLoading?: boolean
  onEventClick?: (event: CalendarEvent) => void
}) {
  const [sortedEvents, setSortedEvents] = useState<CalendarEvent[]>([])

  useEffect(() => {
    // Sort events by start date
    const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime())
    setSortedEvents(sorted)
  }, [events])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (sortedEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No events scheduled</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">Create a new session or sync your Google Calendar</p>
      </div>
    )
  }

  // Group events by date
  const eventsByDate: Record<string, CalendarEvent[]> = {}
  sortedEvents.forEach((event) => {
    const dateKey = event.start.toDateString()
    if (!eventsByDate[dateKey]) {
      eventsByDate[dateKey] = []
    }
    eventsByDate[dateKey].push(event)
  })

  return (
    <div className="space-y-6">
      {Object.entries(eventsByDate).map(([dateKey, dateEvents]) => (
        <div key={dateKey} className="space-y-3">
          <h3 className="font-medium text-lg sticky top-0 bg-background py-2 z-10">
            {new Date(dateKey).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h3>
          <div className="space-y-3">
            {dateEvents.map((event) => {
              if (event.source === "google") {
                return (
                  <Card
                    key={event.id}
                    className="overflow-hidden cursor-pointer transition-shadow hover:shadow-md border-l-4 border-l-blue-500"
                    onClick={() => onEventClick?.(event)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-base">{event.title}</h4>
                        <Badge variant="secondary">Google</Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {format(event.start, "h:mm a")} - {format(event.end, "h:mm a")}
                          </span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              } else {
                // For local events, use the SessionCard component
                return (
                  <SessionCard
                    key={event.id}
                    time={format(event.start, "h:mm a")}
                    duration={event.duration || 60}
                    clientName={event.client || ""}
                    clientInitials={event.clientInitials || event.client?.substring(0, 2) || ""}
                    sessionType={event.type || "Session"}
                    onClick={() => onEventClick?.(event)}
                  />
                )
              }
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
