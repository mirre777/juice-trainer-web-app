"use client"

import type { Client } from "@/types/client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Mail, Phone, Target, Calendar } from "lucide-react"

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

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "No date"

    try {
      // Handle Firestore timestamp
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString()
      }
      // Handle regular date
      return new Date(timestamp).toLocaleDateString()
    } catch (error) {
      return "Invalid date"
    }
  }

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow duration-200" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/lemon-avatar.png" alt={client.name} />
              <AvatarFallback className="bg-yellow-100 text-yellow-800">
                {client.initials || client.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{client.name}</h3>
              <Badge className={getStatusColor(client.status)}>{client.status}</Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {client.email && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Mail className="h-4 w-4" />
            <span>{client.email}</span>
          </div>
        )}

        {client.phone && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone className="h-4 w-4" />
            <span>{client.phone}</span>
          </div>
        )}

        {client.goal && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Target className="h-4 w-4" />
            <span className="truncate">{client.goal}</span>
          </div>
        )}

        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>Added {formatDate(client.createdAt)}</span>
        </div>

        {client.program && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              {client.program}
            </Badge>
          </div>
        )}

        {client.sessions && (
          <div className="mt-2 text-sm text-gray-600">
            Sessions: {client.sessions.completed}/{client.sessions.total}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
