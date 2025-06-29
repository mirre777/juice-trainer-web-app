"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Send, Users, Calendar, Clock, Target } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { assignProgramToClient } from "@/app/actions/program-assignment-actions"

interface Client {
  id: string
  name: string
  email: string
  status: string
  initials?: string
  bgColor?: string
  textColor?: string
}

interface Exercise {
  name: string
  sets?: number
  reps?: string
  weight?: string
  duration?: string
  distance?: string
  notes?: string
}

interface Workout {
  name: string
  exercises: Exercise[]
}

interface Week {
  weekNumber: number
  workouts: Workout[]
}

interface ProgramData {
  id: string
  name: string
  description?: string
  duration?: string
  weeks: Week[]
  totalWorkouts: number
  estimatedDuration?: string
}

interface ReviewProgramClientProps {
  programData: ProgramData
}

export default function ReviewProgramClient({ programData }: ReviewProgramClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingClients, setIsFetchingClients] = useState(false)

  const fetchClients = async () => {
    try {
      setIsFetchingClients(true)
      console.log("[ReviewProgram] Fetching clients...")

      const response = await fetch("/api/clients", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch clients: ${response.status}`)
      }

      const data = await response.json()
      console.log("[ReviewProgram] Received clients data:", data)

      if (data.clients && Array.isArray(data.clients)) {
        setClients(data.clients)
        console.log("[ReviewProgram] Set clients:", data.clients.length)
      } else {
        console.warn("[ReviewProgram] Invalid clients data structure:", data)
        setClients([])
      }
    } catch (error) {
      console.error("[ReviewProgram] Error fetching clients:", error)
      toast({
        title: "Error",
        description: "Failed to load clients. Please try again.",
        variant: "destructive",
      })
      setClients([])
    } finally {
      setIsFetchingClients(false)
    }
  }

  const handleSendToClients = async () => {
    if (selectedClients.length === 0) {
      toast({
        title: "No clients selected",
        description: "Please select at least one client to send the program to.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Get trainer ID from cookie
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) return parts.pop()?.split(";").shift()
        return null
      }

      const trainerId = getCookie("user_id")
      if (!trainerId) {
        throw new Error("Trainer ID not found")
      }

      const results = await Promise.allSettled(
        selectedClients.map((clientId) => assignProgramToClient(programData, clientId, trainerId)),
      )

      const successful = results.filter((result) => result.status === "fulfilled" && result.value.success).length

      const failed = results.length - successful

      if (successful > 0) {
        toast({
          title: "Programs sent successfully",
          description: `Program sent to ${successful} client${successful > 1 ? "s" : ""}${failed > 0 ? `. ${failed} failed.` : "."}`,
        })

        if (failed === 0) {
          setIsDialogOpen(false)
          setSelectedClients([])
        }
      } else {
        toast({
          title: "Failed to send programs",
          description: "Could not send the program to any clients. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error sending programs:", error)
      toast({
        title: "Error",
        description: "An error occurred while sending the programs.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClientToggle = (clientId: string) => {
    setSelectedClients((prev) => (prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]))
  }

  const handleDialogOpen = () => {
    setIsDialogOpen(true)
    fetchClients()
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Review Program</h1>
            <p className="text-gray-600">Review and send this program to your clients</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleDialogOpen} className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Send to Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Send Program to Clients</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">Select the clients you want to send this program to:</p>

              <ScrollArea className="h-64 border rounded-md p-4">
                {isFetchingClients ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                    <span className="ml-2 text-sm text-gray-600">Loading clients...</span>
                  </div>
                ) : clients.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No clients found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clients.map((client) => (
                      <div key={client.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={client.id}
                          checked={selectedClients.includes(client.id)}
                          onCheckedChange={() => handleClientToggle(client.id)}
                        />
                        <div className="flex items-center space-x-2 flex-1">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                            style={{
                              backgroundColor: client.bgColor || "#f3f4f6",
                              color: client.textColor || "#374151",
                            }}
                          >
                            {client.initials || client.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{client.name}</p>
                            <p className="text-xs text-gray-500">{client.email}</p>
                          </div>
                        </div>
                        <Badge variant={client.status === "active" ? "default" : "secondary"}>{client.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <div className="flex justify-between items-center pt-4">
                <p className="text-sm text-gray-600">
                  {selectedClients.length} client{selectedClients.length !== 1 ? "s" : ""} selected
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button onClick={handleSendToClients} disabled={selectedClients.length === 0 || isLoading}>
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Program
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Program Overview */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{programData.name}</CardTitle>
              {programData.description && <p className="text-gray-600 mt-2">{programData.description}</p>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                <strong>{programData.weeks.length}</strong> weeks
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                <strong>{programData.totalWorkouts}</strong> workouts
              </span>
            </div>
            {programData.estimatedDuration && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  <strong>{programData.estimatedDuration}</strong> per session
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Program Content */}
      <div className="space-y-6">
        {programData.weeks.map((week, weekIndex) => (
          <Card key={weekIndex}>
            <CardHeader>
              <CardTitle className="text-lg">Week {week.weekNumber}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {week.workouts.map((workout, workoutIndex) => (
                  <div key={workoutIndex}>
                    <h4 className="font-medium text-base mb-3">{workout.name}</h4>
                    <div className="space-y-2">
                      {workout.exercises.map((exercise, exerciseIndex) => (
                        <div
                          key={exerciseIndex}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-sm">{exercise.name}</p>
                            {exercise.notes && <p className="text-xs text-gray-600 mt-1">{exercise.notes}</p>}
                          </div>
                          <div className="text-right">
                            <div className="flex gap-4 text-xs text-gray-600">
                              {exercise.sets && <span>{exercise.sets} sets</span>}
                              {exercise.reps && <span>{exercise.reps} reps</span>}
                              {exercise.weight && <span>{exercise.weight}</span>}
                              {exercise.duration && <span>{exercise.duration}</span>}
                              {exercise.distance && <span>{exercise.distance}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {workoutIndex < week.workouts.length - 1 && <Separator className="my-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
