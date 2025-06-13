"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Trash2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/toast-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { useGoogleAuth } from "@/lib/client-token-service"

interface CalendarListProps {
  onCalendarToggle: (calendarId: string, selected: boolean) => void
  onCalendarDelete: (calendarId: string) => void
  selectedCalendars: Set<string>
}

interface GoogleCalendar {
  id: string
  summary: string
  description?: string
  primary?: boolean
  backgroundColor: string
  foregroundColor: string
  selected: boolean
}

export function CalendarList({ onCalendarToggle, onCalendarDelete, selectedCalendars }: CalendarListProps) {
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { accessToken, isAuthenticated, isLoading: authLoading } = useGoogleAuth()

  const fetchCalendars = async () => {
    if (!accessToken) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch calendars: ${response.status}`)
      }

      const data = await response.json()

      const fetchedCalendars = data.items.map((item: any) => ({
        id: item.id,
        summary: item.summary,
        description: item.description,
        primary: item.primary,
        backgroundColor: item.backgroundColor,
        foregroundColor: item.foregroundColor,
        selected: selectedCalendars.has(item.id),
      }))

      setCalendars(fetchedCalendars)
    } catch (err: any) {
      console.error("Error fetching calendars:", err)
      setError(err.message)
      toast.error({
        title: "Error",
        description: "Failed to load calendars. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (accessToken) {
      fetchCalendars()
    }
  }, [accessToken])

  const handleToggle = (calendarId: string, checked: boolean) => {
    // Update local state immediately for responsiveness
    setCalendars(calendars.map((cal) => (cal.id === calendarId ? { ...cal, selected: checked } : cal)))

    // Propagate change to parent component
    onCalendarToggle(calendarId, checked)
  }

  if (authLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Your Calendars</h3>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>

        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center">
              <Skeleton className="h-4 w-4 mr-3 rounded-full" />
              <div>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24 mt-1" />
              </div>
            </div>
            <Skeleton className="h-6 w-10" />
          </div>
        ))}
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Please connect your Google Calendar to view and manage your calendars.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Your Calendars</h3>
          <button className="text-sm text-gray-500">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center">
              <Skeleton className="h-4 w-4 mr-3 rounded-full" />
              <div>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24 mt-1" />
              </div>
            </div>
            <Skeleton className="h-6 w-10" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Error loading calendars. Please try refreshing.</p>
        <button
          onClick={fetchCalendars}
          className="mt-4 px-4 py-2 bg-black text-white rounded-md flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Your Calendars</h3>
        <button onClick={fetchCalendars} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {calendars.length === 0 ? (
        <p className="text-center py-4 text-gray-500">No calendars found.</p>
      ) : (
        <div className="space-y-4">
          {calendars.map((calendar) => (
            <div key={calendar.id} className="flex items-center justify-between border-b pb-4 last:border-0">
              <div className="flex items-center">
                <div className="h-4 w-4 rounded-full mr-3" style={{ backgroundColor: calendar.backgroundColor }} />
                <div>
                  <p className="font-medium">
                    {calendar.summary} {calendar.primary ? "(Primary)" : ""}
                  </p>
                  <p className="text-sm text-gray-500 truncate max-w-xs">{calendar.id}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`calendar-${calendar.id}`}
                    checked={calendar.selected}
                    onCheckedChange={(checked) => handleToggle(calendar.id, checked)}
                  />
                  <Label
                    htmlFor={`calendar-${calendar.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {calendar.selected ? "Active" : "Inactive"}
                  </Label>
                </div>
                {!calendar.primary && (
                  <button onClick={() => onCalendarDelete(calendar.id)} className="text-gray-500 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
