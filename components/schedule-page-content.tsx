"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Calendar, Users, Clock, ChevronDown } from "lucide-react"
import { useToast } from "@/components/toast-provider"

export default function SchedulePageContent() {
  const { toast } = useToast()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [clientEngagement, setClientEngagement] = useState<any[]>([])

  // Sample data - in a real app, this would be fetched from Firebase
  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setSessions([
        {
          id: "session-1",
          client: "Ryan W.",
          type: "Training",
          date: new Date(2023, 3, 7),
          time: "9:00 AM",
          duration: 60,
        },
        {
          id: "session-2",
          client: "Michael K.",
          type: "Consult",
          date: new Date(2023, 3, 10),
          time: "2:30 PM",
          duration: 45,
        },
        {
          id: "session-3",
          client: "Karen L.",
          type: "Training",
          date: new Date(2023, 3, 11),
          time: "5:45 PM",
          duration: 60,
        },
        {
          id: "session-4",
          client: "Alicia J.",
          type: "Training",
          date: new Date(2023, 3, 14),
          time: "10:00 AM",
          duration: 60,
        },
        {
          id: "session-5",
          client: "Marcus B.",
          type: "Training",
          date: new Date(2023, 3, 15),
          time: "3:30 PM",
          duration: 60,
        },
        {
          id: "session-6",
          client: "Ryan W.",
          type: "Consult",
          date: new Date(2023, 3, 19),
          time: "11:00 AM",
          duration: 45,
        },
        {
          id: "session-7",
          client: "Alicia J.",
          type: "Assessment",
          date: new Date(2023, 3, 21),
          time: "10:00 AM",
          duration: 60,
        },
        {
          id: "session-8",
          client: "Michael K.",
          type: "Training",
          date: new Date(2023, 3, 21),
          time: "3:00 PM",
          duration: 60,
        },
        {
          id: "session-9",
          client: "Alicia J.",
          type: "Assessment",
          date: new Date(2023, 3, 24),
          time: "10:00 AM",
          duration: 60,
        },
        {
          id: "session-10",
          client: "Marcus B.",
          type: "Training",
          date: new Date(2023, 3, 26),
          time: "3:30 PM",
          duration: 60,
        },
        {
          id: "session-11",
          client: "Karen L.",
          type: "Consult",
          date: new Date(2023, 3, 30),
          time: "4:00 PM",
          duration: 45,
        },
      ])

      setClientEngagement([
        { name: "Ryan Wilson", engagement: 96 },
        { name: "Alicia Johnson", engagement: 92 },
        { name: "Michael Keaton", engagement: 88 },
        { name: "Karen Lewis", engagement: 78 },
      ])

      setLoading(false)
    }, 1000)
  }, [])

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const handleNewSession = () => {
    toast.success({
      title: "New Session",
      description: "Session creation form would open here",
    })
  }

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    // Get the first day of the month
    const firstDay = new Date(year, month, 1)
    // Get the last day of the month
    const lastDay = new Date(year, month + 1, 0)

    // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay()

    // Calculate days from previous month to show
    const daysFromPrevMonth = firstDayOfWeek
    const prevMonthLastDay = new Date(year, month, 0).getDate()

    // Calculate total days to show (previous month + current month + next month)
    const totalDays = 42 // 6 rows of 7 days

    const days = []

    // Add days from previous month
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i)
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        sessions: sessions.filter(
          (session) =>
            session.date.getDate() === date.getDate() &&
            session.date.getMonth() === date.getMonth() &&
            session.date.getFullYear() === date.getFullYear(),
        ),
      })
    }

    // Add days from current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i)
      const today = new Date()
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()

      days.push({
        date,
        isCurrentMonth: true,
        isToday,
        sessions: sessions.filter(
          (session) =>
            session.date.getDate() === date.getDate() &&
            session.date.getMonth() === date.getMonth() &&
            session.date.getFullYear() === date.getFullYear(),
        ),
      })
    }

    // Add days from next month
    const remainingDays = totalDays - days.length
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i)
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        sessions: sessions.filter(
          (session) =>
            session.date.getDate() === date.getDate() &&
            session.date.getMonth() === date.getMonth() &&
            session.date.getFullYear() === date.getFullYear(),
        ),
      })
    }

    return days
  }

  const calendarDays = generateCalendarDays()

  // Group calendar days into weeks
  const weeks = []
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7))
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header with title and new session button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-base font-medium">Sessions Calendar</h1>

        <div className="flex items-center gap-4">
          <button onClick={handleNewSession} className="px-4 py-2 bg-green-100 text-green-800 rounded-md text-xs">
            + New Session
          </button>

          <div className="flex items-center gap-2">
            <button onClick={handlePrevMonth} className="p-1">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm">April 2025</span>
            <button onClick={handleNextMonth} className="p-1">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative">
          <button className="px-3 py-2 border rounded-md text-xs flex items-center gap-2">
            <Users className="h-3 w-3" />
            All Clients
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>

        <div className="relative">
          <button className="px-3 py-2 border rounded-md text-xs flex items-center gap-2">
            <Clock className="h-3 w-3" />
            All Session Types
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>

        <div className="relative">
          <button className="px-3 py-2 border rounded-md text-xs flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            Date Range
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>

        <div className="ml-auto">
          <div className="border rounded-md overflow-hidden flex">
            <button
              className={`px-3 py-2 text-xs ${viewMode === "calendar" ? "bg-green-100" : "bg-white"}`}
              onClick={() => setViewMode("calendar")}
            >
              Calendar
            </button>
            <button
              className={`px-3 py-2 text-xs ${viewMode === "list" ? "bg-green-100" : "bg-white"}`}
              onClick={() => setViewMode("list")}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <div className="border rounded-lg overflow-hidden mb-8">
          {/* Calendar Header */}
          <div className="grid grid-cols-7 text-center border-b">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-2 text-xs font-medium">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div>
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 border-b last:border-b-0">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`min-h-[100px] p-2 border-r last:border-r-0 ${
                      !day.isCurrentMonth ? "bg-gray-50 text-gray-400" : day.isToday ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="text-right text-xs mb-1">{day.date.getDate()}</div>

                    <div className="space-y-1">
                      {day.sessions.map((session) => (
                        <div
                          key={session.id}
                          className={`text-xs p-1 rounded ${
                            session.type === "Training"
                              ? "bg-green-100 text-green-800"
                              : session.type === "Consult"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          <div className="font-medium">
                            {session.client} - {session.type}
                          </div>
                          <div>{session.time}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Monthly Sessions Chart */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-gray-400" />
            <h3 className="font-medium text-sm">Monthly Sessions</h3>
          </div>

          <div className="h-40 relative">
            {/* This would be a real chart in production */}
            <div className="absolute inset-0 flex items-end">
              <div className="w-1/6 bg-blue-400 rounded-t h-[30%]"></div>
              <div className="w-1/6 bg-blue-400 rounded-t h-[40%]"></div>
              <div className="w-1/6 bg-blue-400 rounded-t h-[35%]"></div>
              <div className="w-1/6 bg-blue-400 rounded-t h-[45%]"></div>
              <div className="w-1/6 bg-blue-400 rounded-t h-[50%]"></div>
              <div className="w-1/6 bg-blue-400 rounded-t h-[60%]"></div>
            </div>
          </div>

          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
          </div>
        </div>

        {/* Session Types Chart */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-gray-400" />
            <h3 className="font-medium text-sm">Session Types</h3>
          </div>

          <div className="h-40 flex items-center justify-center">
            {/* This would be a real chart in production */}
            <div className="w-32 h-32 rounded-full border-8 border-blue-400 relative">
              <div className="absolute inset-0 border-t-8 border-r-8 border-orange-400 rounded-full rotate-45"></div>
              <div className="absolute inset-0 border-t-8 border-green-400 rounded-full rotate-[250deg]"></div>
            </div>
          </div>
        </div>

        {/* Client Engagement */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-gray-400" />
            <h3 className="font-medium text-sm">Client Engagement</h3>
          </div>

          <div className="space-y-4">
            {clientEngagement.map((client) => (
              <div key={client.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{client.name}</span>
                  <span>{client.engagement}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${client.engagement}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
