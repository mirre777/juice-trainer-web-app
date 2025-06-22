"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle2, MessageSquare, FileText, Calendar, Dumbbell } from "lucide-react"

type ActivityType = "workout" | "message" | "appointment" | "note" | "goal"

interface Activity {
  id: string
  type: ActivityType
  client: {
    name: string
    avatar?: string
    initials: string
  }
  description: string
  time: string
}

export function RecentActivitiesList() {
  // Sample data - would come from API in a real app
  const activities: Activity[] = [
    {
      id: "1",
      type: "workout",
      client: {
        name: "Alex Johnson",
        initials: "AJ",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      description: "Completed upper body workout",
      time: "10 minutes ago",
    },
    {
      id: "2",
      type: "message",
      client: {
        name: "Sarah Miller",
        initials: "SM",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      description: "Sent you a message about diet plan",
      time: "45 minutes ago",
    },
    {
      id: "3",
      type: "appointment",
      client: {
        name: "Mike Wilson",
        initials: "MW",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      description: "Scheduled a session for tomorrow",
      time: "2 hours ago",
    },
    {
      id: "4",
      type: "note",
      client: {
        name: "Jessica Lee",
        initials: "JL",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      description: "Added progress notes",
      time: "3 hours ago",
    },
    {
      id: "5",
      type: "goal",
      client: {
        name: "David Brown",
        initials: "DB",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      description: "Achieved weight loss goal",
      time: "5 hours ago",
    },
  ]

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case "workout":
        return <Dumbbell className="h-4 w-4 text-info" />
      case "message":
        return <MessageSquare className="h-4 w-4 text-success" />
      case "appointment":
        return <Calendar className="h-4 w-4 text-primary" />
      case "note":
        return <FileText className="h-4 w-4 text-warning" />
      case "goal":
        return <CheckCircle2 className="h-4 w-4 text-success" />
    }
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start space-x-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src={activity.client.avatar || "/placeholder.svg"} alt={activity.client.name} />
            <AvatarFallback>{activity.client.initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-1">
            <div className="flex items-center">
              <p className="text-sm font-medium">{activity.client.name}</p>
              <div className="ml-2 bg-gray-100 p-1 rounded-full">{getActivityIcon(activity.type)}</div>
            </div>
            <p className="text-sm text-gray-500">{activity.description}</p>
            <p className="text-xs text-gray-400">{activity.time}</p>
          </div>
        </div>
      ))}

      <button className="text-sm text-info hover:text-info/80 font-medium w-full text-center mt-2">
        View all activities
      </button>
    </div>
  )
}
