"use client"

import { useState, useEffect } from "react"
import { SessionCalendar } from "./SessionCalendar"
import { CalendarListView } from "./calendar-list-view"
import { NewSessionDialog } from "./new-session-dialog"
import { Button } from "@/components/ui/button"
import { Calendar, List, Plus } from "lucide-react"
import { useCurrentUser } from "@/hooks/use-current-user"

interface CalendarPageLayoutClientProps {
  initialSessions?: any[]
}

export default function CalendarPageLayoutClient({ initialSessions = [] }: CalendarPageLayoutClientProps) {
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")
  const [sessions, setSessions] = useState(initialSessions)
  const [isNewSessionOpen, setIsNewSessionOpen] = useState(false)
  const { user, loading } = useCurrentUser()

  const refreshSessions = async () => {
    try {
      const response = await fetch("/api/sessions")
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error("Failed to refresh sessions:", error)
    }
  }

  useEffect(() => {
    if (user && !loading) {
      refreshSessions()
    }
  }, [user, loading])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Calendar</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Calendar
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="flex items-center gap-2"
            >
              <List className="h-4 w-4" />
              List
            </Button>
          </div>
          <Button onClick={() => setIsNewSessionOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Session
          </Button>
        </div>
      </div>

      {viewMode === "calendar" ? (
        <SessionCalendar sessions={sessions} onSessionUpdate={refreshSessions} />
      ) : (
        <CalendarListView sessions={sessions} onSessionUpdate={refreshSessions} />
      )}

      <NewSessionDialog open={isNewSessionOpen} onOpenChange={setIsNewSessionOpen} onSessionCreated={refreshSessions} />
    </div>
  )
}

// Named export for compatibility
export { CalendarPageLayoutClient }
