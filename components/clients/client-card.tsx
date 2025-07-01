"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreVertical, Mail, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Client {
  id: string
  name: string
  email: string
  phone?: string
  status: string
  progress?: number
  sessions?: { completed: number; total: number }
  lastWorkout?: { name: string; date: string; completion: number }
  avatar?: string
  initials?: string
}

interface ClientCardProps {
  client: Client
  onClick?: () => void
}

export function ClientCard({ client, onClick }: ClientCardProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={client.avatar || "/lemon-avatar.png"} alt={client.name} />
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {client.initials || getInitials(client.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{client.name}</h3>
              <Badge className={`text-xs ${getStatusColor(client.status)}`}>{client.status}</Badge>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {client.email && (
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="h-4 w-4 mr-2" />
              {client.email}
            </div>
          )}
          {client.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="h-4 w-4 mr-2" />
              {client.phone}
            </div>
          )}
        </div>

        {client.sessions && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Sessions</span>
              <span className="font-medium">
                {client.sessions.completed}/{client.sessions.total}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: `${client.sessions.total > 0 ? (client.sessions.completed / client.sessions.total) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </div>
        )}

        {client.lastWorkout && client.lastWorkout.name && (
          <div className="mt-3 text-sm text-gray-600">
            <span className="font-medium">Last workout:</span> {client.lastWorkout.name}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
