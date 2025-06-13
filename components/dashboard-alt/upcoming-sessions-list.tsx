"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin } from "lucide-react"
import Link from "next/link"
import { ComingSoonOverlay } from "@/components/ui/coming-soon-overlay"

interface Session {
  id: string
  client: {
    name: string
    avatar?: string
    initials: string
  }
  type: "in-person" | "virtual"
  time: string
  duration: string
  location?: string
  focus: string
}

export function UpcomingSessionsList() {
  // Sample data - would come from API in a real app
  const sessions: Session[] = [
    {
      id: "1",
      client: {
        name: "Alex Johnson",
        initials: "AJ",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      type: "in-person",
      time: "Today, 2:00 PM",
      duration: "60 min",
      location: "Main Gym",
      focus: "Upper Body Strength",
    },
    {
      id: "2",
      client: {
        name: "Sarah Miller",
        initials: "SM",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      type: "virtual",
      time: "Today, 4:30 PM",
      duration: "45 min",
      focus: "Cardio Conditioning",
    },
    {
      id: "3",
      client: {
        name: "Mike Wilson",
        initials: "MW",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      type: "in-person",
      time: "Tomorrow, 10:00 AM",
      duration: "60 min",
      location: "Studio B",
      focus: "Full Body Assessment",
    },
    {
      id: "4",
      client: {
        name: "Jessica Lee",
        initials: "JL",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      type: "virtual",
      time: "Tomorrow, 1:15 PM",
      duration: "30 min",
      focus: "Mobility Work",
    },
  ]

  return (
    <div className="relative">
      <ComingSoonOverlay message="Sessions Coming Soon">
        <div className="space-y-4">
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
              >
                {/* Avatar on the left */}
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={session.client.avatar || "/placeholder.svg"} alt={session.client.name} />
                  <AvatarFallback>{session.client.initials}</AvatarFallback>
                </Avatar>

                {/* Session details in the middle */}
                <div className="flex-1 mx-4">
                  <div>
                    <p className="font-medium">{session.client.name}</p>
                    <p className="text-sm text-gray-500">{session.focus}</p>

                    {session.location && (
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{session.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Time and duration on the right */}
                <div className="text-center">
                  <div className="text-gray-500">{session.time.split(", ")[1]}</div>
                  <div className="text-sm">{session.duration}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>No upcoming sessions. Schedule sessions from the Calendar page.</p>
              <button className="mt-4 bg-lime-400 hover:bg-lime-500 text-black font-medium px-6 py-2 rounded-lg">
                Sync Calendar
              </button>
            </div>
          )}

          <Link
            href="/calendar"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-center mt-2 block"
          >
            View All Sessions
          </Link>
        </div>
      </ComingSoonOverlay>
    </div>
  )
}
