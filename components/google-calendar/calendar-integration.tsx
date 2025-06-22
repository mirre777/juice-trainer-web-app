"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { CalendarPlus, AlertCircle } from "lucide-react"
import { GoogleCalendarAuthButton } from "./auth-button"
import { CalendarList } from "./calendar-list"
import { CalendarEvents } from "./calendar-events"
import { EventCreateDialog } from "./event-create-dialog"
import { useGoogleAuth } from "@/lib/client-token-service"
import { useSearchParams } from "next/navigation"
import { useToast } from "@/components/toast-provider"

export function GoogleCalendarIntegration() {
  const [selectedCalendars, setSelectedCalendars] = useState<Set<string>>(new Set())
  const [availableCalendars, setAvailableCalendars] = useState<Array<{ id: string; name: string }>>([])
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [defaultCalendarId, setDefaultCalendarId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("upcoming")

  const { isAuthenticated, accessToken, isLoading, error } = useGoogleAuth()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Check for success/error messages in URL
  useEffect(() => {
    const success = searchParams.get("success")
    const error = searchParams.get("error")
    const logout = searchParams.get("logout")

    if (success) {
      toast.success({
        title: "Connected",
        description: "Successfully connected to Google Calendar",
      })
    }

    if (error) {
      toast.error({
        title: "Authentication Error",
        description: `Failed to connect to Google Calendar: ${error}`,
      })
    }

    if (logout) {
      toast.success({
        title: "Signed out",
        description: "Successfully disconnected from Google Calendar",
      })
    }
  }, [searchParams, toast])

  // Load saved calendar selection from localStorage on mount
  useEffect(() => {
    const savedCalendars = localStorage.getItem("selectedCalendars")
    if (savedCalendars) {
      setSelectedCalendars(new Set(JSON.parse(savedCalendars)))
    }
  }, [])

  // Fetch the list of calendars when authenticated
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchCalendarList()
    }
  }, [isAuthenticated, accessToken])

  // Fetch the list of calendars to get their names
  const fetchCalendarList = async () => {
    if (!accessToken) return

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

      // Create array of calendars for the event creation dialog
      const calendars = data.items.map((item: any) => ({
        id: item.id,
        name: item.summary,
      }))

      setAvailableCalendars(calendars)

      // Auto-select primary calendar
      const primaryCalendar = data.items.find((item: any) => item.primary)
      if (primaryCalendar && !selectedCalendars.has(primaryCalendar.id)) {
        const newSelectedCalendars = new Set(selectedCalendars)
        newSelectedCalendars.add(primaryCalendar.id)
        setSelectedCalendars(newSelectedCalendars)
        localStorage.setItem("selectedCalendars", JSON.stringify([...newSelectedCalendars]))
        setDefaultCalendarId(primaryCalendar.id)
      }
    } catch (error) {
      console.error("Error fetching calendar list:", error)
    }
  }

  // Handle calendar toggle
  const handleCalendarToggle = (calendarId: string, selected: boolean) => {
    const newSelectedCalendars = new Set(selectedCalendars)

    if (selected) {
      newSelectedCalendars.add(calendarId)
    } else {
      newSelectedCalendars.delete(calendarId)
    }

    setSelectedCalendars(newSelectedCalendars)
    localStorage.setItem("selectedCalendars", JSON.stringify([...newSelectedCalendars]))
  }

  // Handle calendar delete (this wouldn't actually delete the calendar, just remove it from our view)
  const handleCalendarDelete = (calendarId: string) => {
    const newSelectedCalendars = new Set(selectedCalendars)
    newSelectedCalendars.delete(calendarId)
    setSelectedCalendars(newSelectedCalendars)
    localStorage.setItem("selectedCalendars", JSON.stringify([...newSelectedCalendars]))
  }

  // Handle event creation
  const handleEventCreated = () => {
    // Refresh events view
    setActiveTab("upcoming")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">Google Calendar Integration</CardTitle>

          {isAuthenticated && (
            <Button
              onClick={() => setShowCreateEvent(true)}
              variant="default"
              size="sm"
              disabled={!isAuthenticated || selectedCalendars.size === 0}
            >
              <CalendarPlus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          )}
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {!isAuthenticated ? (
              <div className="py-4">
                <div className="mb-6 text-center">
                  <p className="text-gray-600 mb-4">
                    Connect your Google Calendar to sync your schedule and prevent double-bookings.
                  </p>
                  <GoogleCalendarAuthButton />
                </div>
              </div>
            ) : (
              <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
                  <TabsTrigger value="calendars">My Calendars</TabsTrigger>
                  <TabsTrigger value="settings">Integration Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming">
                  <CalendarEvents selectedCalendars={selectedCalendars} days={10} />
                </TabsContent>

                <TabsContent value="calendars">
                  <CalendarList
                    onCalendarToggle={handleCalendarToggle}
                    onCalendarDelete={handleCalendarDelete}
                    selectedCalendars={selectedCalendars}
                  />
                </TabsContent>

                <TabsContent value="settings">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Connection Status</h3>
                      <div className="flex items-center p-4 mb-4 text-sm rounded-lg bg-green-50 text-green-800">
                        <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg bg-green-100 text-green-500">
                          <svg
                            className="w-4 h-4"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 20 20"
                          >
                            <path
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 8l3 3 6-6"
                            />
                          </svg>
                          <span className="sr-only">Success</span>
                        </div>
                        <div className="ml-3 font-medium">Your Google Calendar is connected successfully.</div>
                      </div>

                      <GoogleCalendarAuthButton />
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">Data Usage</h3>
                      <div className="flex items-start p-4 mb-4 text-sm rounded-lg bg-blue-50 text-blue-800">
                        <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium mb-2">Privacy Information</p>
                          <p>
                            Juice only accesses your calendar data to display events and prevent scheduling conflicts.
                            We do not store your calendar data on our servers or share it with third parties.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Event Creation Dialog */}
      <EventCreateDialog
        open={showCreateEvent}
        onOpenChange={setShowCreateEvent}
        selectedCalendarId={defaultCalendarId}
        availableCalendars={availableCalendars}
        onEventCreated={handleEventCreated}
      />
    </div>
  )
}
