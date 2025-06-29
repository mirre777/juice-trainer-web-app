"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Send, Users, Calendar, Clock, Target } from "lucide-react"
import type { WorkoutProgram } from "@/types/workout-program"
import { sendProgramToClient } from "@/app/actions/program-assignment-actions"
import { toast } from "@/hooks/use-toast"

interface Client {
  id: string
  name: string
  email: string
  avatar?: string
}

interface ReviewProgramClientProps {
  program: WorkoutProgram
  importId: string
}

export default function ReviewProgramClient({ program, importId }: ReviewProgramClientProps) {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoadingClients, setIsLoadingClients] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const fetchClients = async () => {
    setIsLoadingClients(true)
    try {
      console.log("[ReviewProgram] Fetching clients...")
      const response = await fetch("/api/clients")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("[ReviewProgram] API response:", data)

      if (data.clients && Array.isArray(data.clients)) {
        setClients(data.clients)
        console.log("[ReviewProgram] Loaded clients:", data.clients.length)
      } else {
        console.error("[ReviewProgram] Invalid response format:", data)
        setClients([])
      }
    } catch (error) {
      console.error("[ReviewProgram] Error fetching clients:", error)
      toast.error({
        title: "Error",
        description: "Failed to load clients. Please try again.",
      })
      setClients([])
    } finally {
      setIsLoadingClients(false)
    }
  }

  const handleSendToClient = async (client: Client) => {
    if (!client || !program) return

    setIsSending(true)
    setSelectedClient(client)

    try {
      console.log("[ReviewProgram] Sending program to client:", client.id)
      const result = await sendProgramToClient(program, client.id)

      if (result.success) {
        toast.success({
          title: "Success!",
          description: `Program sent to ${client.name} successfully.`,
        })
        setIsDialogOpen(false)
        // Optionally redirect or update UI
      } else {
        toast.error({
          title: "Error",
          description: result.message || "Failed to send program to client.",
        })
      }
    } catch (error: any) {
      console.error("[ReviewProgram] Error sending program:", error)
      toast.error({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
      })
    } finally {
      setIsSending(false)
      setSelectedClient(null)
    }
  }

  const handleDialogOpen = () => {
    setIsDialogOpen(true)
    fetchClients()
  }

  const totalExercises =
    program.weeks?.reduce((total, week) => {
      return (
        total +
        (week.routines?.reduce((weekTotal, routine) => {
          return weekTotal + (routine.exercises?.length || 0)
        }, 0) || 0)
      )
    }, 0) || 0

  const totalWeeks = program.weeks?.length || 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{program.name}</h1>
          <p className="text-muted-foreground">Review and send to client</p>
        </div>
      </div>

      {/* Program Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Program Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>{totalWeeks}</strong> weeks
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>{totalExercises}</strong> total exercises
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>{program.weeks?.reduce((total, week) => total + (week.routines?.length || 0), 0) || 0}</strong>{" "}
                workouts
              </span>
            </div>
          </div>

          {program.description && <p className="text-sm text-muted-foreground">{program.description}</p>}
        </CardContent>
      </Card>

      {/* Program Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Program Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {program.weeks?.map((week, weekIndex) => (
                <div key={weekIndex} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Week {weekIndex + 1}</h3>
                  <div className="space-y-3">
                    {week.routines?.map((routine, routineIndex) => (
                      <div key={routineIndex} className="pl-4 border-l-2 border-muted">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{routine.name}</h4>
                          <Badge variant="secondary">{routine.exercises?.length || 0} exercises</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {routine.exercises?.slice(0, 4).map((exercise, exerciseIndex) => (
                            <div key={exerciseIndex} className="text-sm text-muted-foreground">
                              • {exercise.name}
                            </div>
                          ))}
                          {(routine.exercises?.length || 0) > 4 && (
                            <div className="text-sm text-muted-foreground">
                              ... and {(routine.exercises?.length || 0) - 4} more
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleDialogOpen} className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Send to Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Select Client</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {isLoadingClients ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : clients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No clients found</p>
                  <p className="text-sm">Add clients to send programs to them.</p>
                </div>
              ) : (
                <ScrollArea className="max-h-96">
                  <div className="space-y-2">
                    {clients.map((client) => (
                      <div
                        key={client.id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handleSendToClient(client)}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={client.avatar || "/placeholder.svg"} alt={client.name} />
                          <AvatarFallback>
                            {client.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{client.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{client.email}</p>
                        </div>
                        {isSending && selectedClient?.id === client.id && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Button variant="outline" onClick={() => router.push("/import-programs")}>
          Back to Imports
        </Button>
      </div>
    </div>
  )
}
