"use client"

import type React from "react"
import { useState } from "react"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Session {
  id: string
  title: string
  client: string
  date: Date
  time: string
  type: "training" | "consultation" | "assessment"
}

interface SessionCalendarProps {
  sessions?: Session[]
  onSessionClick?: (session: Session) => void
  onDateSelect?: (date: Date) => void
}

export const SessionCalendar: React.FC<SessionCalendarProps> = ({ sessions = [], onSessionClick, onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date())

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Session Calendar
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center text-gray-500 py-8">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Calendar view coming soon</p>
          <p className="text-sm">Sessions: {sessions.length}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default SessionCalendar
