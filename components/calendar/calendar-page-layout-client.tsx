"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { CalendarListView } from "@/components/calendar/calendar-list-view"
import { NewEventDialog } from "@/components/calendar/new-event-dialog"
import { CalendarIntegration } from "@/components/calendar/calendar-integration"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { NewSessionDialog } from "@/components/calendar/new-session-dialog"
import { PageLayout } from "@/components/shared/page-layout"

// Mock data for demonstration
const mockClients = [
  { id: "1", name: "Ryan Wilson" },
  { id: "2", name: "Alicia Johnson" },
  { id: "3", name: "Michael Keaton" },
  { id: "4", name: "Karen Lewis" },
]

const mockSessionTypes = [
  { id: "1", name: "Training" },
  { id: "2", name: "Consult" },
  { id: "3", name: "Assessment" },
]

const mockEvents = [
  {
    id: "1",
    title: "Training Session",
    start: new Date(2025, 3, 15, 10, 0),
    end: new Date(2025, 3, 15, 11, 0),
    client: "Ryan Wilson",
    clientInitials: "RW",
    type: "Upper Body Strength",
    location: "Downtown Gym",
    duration: 60,
    source: "local" as const,
  },
  {
    id: "2",
    title: "Assessment",
    start: new Date(2025, 3, 15, 14, 0),
    end: new Date(2025, 3, 15, 15, 0),
    client: "Alicia Johnson",
    clientInitials: "AJ",
    type: "Fitness Evaluation",
    location: "Virtual Meeting",
    duration: 60,
    source: "local" as const,
  },
  {
    id: "3",
    title: "Team Meeting",
    start: new Date(2025, 3, 16, 9, 0),
    end: new Date(2025, 3, 16, 10, 0),
    location: "Office",
    duration: 60,
    source: "google" as const,
  },
]

interface CalendarPageLayoutProps {
  isDemo?: boolean
}

export function CalendarPageLayoutClient({ isDemo = true }: CalendarPageLayoutProps) {
  const [isNewSessionDialogOpen, setIsNewSessionDialogOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState("April 2025") // This would be dynamic in a real app
  const [view, setView] = useState<"calendar" | "list">("calendar")
  const [events, setEvents] = useState(mockEvents)
  const [isNewEventDialogOpen, setIsNewEventDialogOpen] = useState(false)
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [toastMessage, setToastMessage] = useState<{ title: string; description: string } | null>(null)

  // Use the toast hook safely (we're guaranteed to be on the client)
  const { toast } = useToast()

  useEffect(() => {
    // Show toast if there's a message
    if (toastMessage && toast) {
      toast(toastMessage)
      setToastMessage(null)
    }
  }, [toastMessage, toast])

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    // Check if Google Calendar is connected
    const checkGoogleCalendarStatus = async () => {
      try {
        const response = await fetch("/api/auth/google/status")
        const data = await response.json()
        setIsGoogleCalendarConnected(data.isConnected)
        if (data.lastSynced) {
          setLastSynced(new Date(data.lastSynced))
        }
      } catch (error) {
        console.error("Failed to check Google Calendar status:", error)
      }
    }

    checkGoogleCalendarStatus()

    return () => clearTimeout(timer)
  }, [])

  const handleCreateEvent = async (eventData: any) => {
    // In a real app, you would send this to your API
    console.log("Creating event:", eventData)

    // For demo purposes, we'll just add it to the local state
    const newEvent = {
      id: `local-${Date.now()}`,
      title: eventData.title || "Training Session",
      start: new Date(`${eventData.date}T${eventData.startTime}`),
      end: new Date(`${eventData.date}T${eventData.endTime}`),
      client: mockClients.find((c) => c.id === eventData.clientId)?.name,
      clientInitials:
        mockClients
          .find((c) => c.id === eventData.clientId)
          ?.name.substring(0, 2)
          .toUpperCase() || "UC",
      type: mockSessionTypes.find((t) => t.id === eventData.typeId)?.name || "Session",
      location: eventData.location,
      duration: Math.round(
        (new Date(`${eventData.date}T${eventData.endTime}`).getTime() -
          new Date(`${eventData.date}T${eventData.startTime}`).getTime()) /
          (1000 * 60),
      ),
      source: "local" as const,
    }

    setEvents((prev) => [...prev, newEvent])

    // Set toast message instead of directly calling toast
    setToastMessage({
      title: "Session created",
      description: "Your new session has been created successfully.",
    })
  }

  const handleConnectGoogleCalendar = async () => {
    // In a real app, you would redirect to Google OAuth flow
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsGoogleCalendarConnected(true)
    setLastSynced(new Date())
  }

  const handleDisconnectGoogleCalendar = async () => {
    // In a real app, you would call your API to revoke access
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsGoogleCalendarConnected(false)
    setLastSynced(null)
  }

  const handleSyncGoogleCalendar = async () => {
    // In a real app, you would call your API to sync events
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setLastSynced(new Date())

    // Simulate adding a new event from Google Calendar
    const newGoogleEvent = {
      id: `google-${Date.now()}`,
      title: "Client Meeting",
      start: new Date(2025, 3, 17, 13, 0),
      end: new Date(2025, 3, 17, 14, 0),
      location: "Google Meet",
      duration: 60,
      source: "google" as const,
    }

    setEvents((prev) => [...prev, newGoogleEvent])
  }

  const handleEventClick = (event: any) => {
    // Set toast message instead of directly calling toast
    setToastMessage({
      title: event.title,
      description: `${format(event.start, "EEE, MMM d")} • ${format(event.start, "h:mm a")} (${event.duration} min)`,
    })
  }

  return (
    <div className="w-full">
      <PageLayout isDemo={isDemo}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <div className="p-4 flex justify-between items-center border-b">
                <h2 className="text-xl font-bold">{currentMonth}</h2>
                <Button
                  onClick={() => setIsNewSessionDialogOpen(true)}
                  className="bg-[#D2FF28] text-black hover:bg-[#c2ef18]"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New Session
                </Button>
              </div>
              <div className="p-4">
                {/* Calendar component would go here */}
                <div className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Calendar View</p>
                </div>
              </div>
            </Card>

            <CalendarListView events={isDemo ? events : []} isLoading={isLoading} onEventClick={handleEventClick} />
          </div>

          <div>
            <CalendarIntegration
              isConnected={isGoogleCalendarConnected}
              onConnect={handleConnectGoogleCalendar}
              onDisconnect={handleDisconnectGoogleCalendar}
              lastSynced={lastSynced}
              onSync={handleSyncGoogleCalendar}
            />
          </div>
        </div>

        <NewEventDialog
          open={isNewEventDialogOpen}
          onOpenChange={setIsNewEventDialogOpen}
          onSave={handleCreateEvent}
          clients={mockClients}
          sessionTypes={mockSessionTypes}
        />
        <NewSessionDialog open={isNewSessionDialogOpen} onOpenChange={setIsNewSessionDialogOpen} />
      </PageLayout>
    </div>
  )
}
