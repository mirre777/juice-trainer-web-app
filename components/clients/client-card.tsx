"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MoreHorizontal, Calendar, TrendingUp, MessageSquare } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ClientActions } from "./client-actions"
import { ClientQuickViewModal } from "./client-quick-view-modal"
import type { Client } from "@/types/client"

interface ClientCardProps {
  client: Client
  onClientUpdated?: () => void
}

export function ClientCard({ client, onClientUpdated }: ClientCardProps) {
  const [showQuickView, setShowQuickView] = useState(false)
  const [workoutCount, setWorkoutCount] = useState<number | null>(null)
  const [lastWorkoutDate, setLastWorkoutDate] = useState<string | null>(null)

  // Safely fetch workout data without breaking the card if it fails
  useEffect(() => {
    const fetchWorkoutData = async () => {
      if (!client.userId) {
        return // Skip if client doesn't have a linked account
      }

      try {
        const response = await fetch(`/api/clients/${client.id}/workouts`)
        if (response.ok) {
          const data = await response.json()
          if (data.workouts && Array.isArray(data.workouts)) {
            setWorkoutCount(data.workouts.length)

            // Find the most recent workout
            const sortedWorkouts = data.workouts.sort((a, b) => {
              const dateA = new Date(a.startedAt || a.createdAt || 0)
              const dateB = new Date(b.startedAt || b.createdAt || 0)
              return dateB.getTime() - dateA.getTime()
            })

            if (sortedWorkouts.length > 0) {
              const lastWorkout = sortedWorkouts[0]
              const date = new Date(lastWorkout.startedAt || lastWorkout.createdAt)
              setLastWorkoutDate(date.toLocaleDateString())
            }
          }
        } else {
          console.log(`[ClientCard] Failed to fetch workouts for client ${client.id}:`, response.status)
        }
      } catch (error) {
        console.log(`[ClientCard] Error fetching workouts for client ${client.id}:`, error)
        // Don't show error to user, just log it
      }
    }

    fetchWorkoutData()
  }, [client.id, client.userId])

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
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowQuickView(true)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback style={{ backgroundColor: client.bgColor, color: client.textColor }}>
                  {getInitials(client.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-sm">{client.name}</h3>
                <p className="text-xs text-gray-500">{client.email || "No email"}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <ClientActions client={client} onClientUpdated={onClientUpdated} />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge className={getStatusColor(client.status)}>{client.status}</Badge>
              {client.userId && (
                <Badge variant="outline" className="text-xs">
                  Linked Account
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-3 w-3 text-gray-400" />
                <span className="text-gray-600">
                  {workoutCount !== null ? `${workoutCount} workouts` : "Loading..."}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-3 w-3 text-gray-400" />
                <span className="text-gray-600">{lastWorkoutDate || "No workouts"}</span>
              </div>
            </div>

            {client.goal && (
              <div className="text-xs">
                <span className="text-gray-500">Goal: </span>
                <span className="text-gray-700">{client.goal}</span>
              </div>
            )}

            {client.notes && (
              <div className="flex items-start space-x-2 text-xs">
                <MessageSquare className="h-3 w-3 text-gray-400 mt-0.5" />
                <span className="text-gray-600 line-clamp-2">{client.notes}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ClientQuickViewModal
        client={client}
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
        onClientUpdated={onClientUpdated}
      />
    </>
  )
}
