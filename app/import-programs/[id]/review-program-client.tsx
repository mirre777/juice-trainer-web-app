"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Send, Users, Calendar, Clock, Target } from "lucide-react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { assignProgramToMultipleClients } from "@/app/actions/program-assignment-actions"
import { toast } from "@/hooks/use-toast"

interface Client {
  id: string
  name: string
  email: string
  status: "active" | "inactive" | "pending"
}

interface Exercise {
  name: string
  sets: number
  reps: string
  weight?: string
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

interface Program {
  id: string
  name: string
  description?: string
  duration: number
  weeks: Week[]
  createdAt: Date
}

interface ReviewProgramClientProps {
  program: Program
  programId: string
}

export default function ReviewProgramClient({ program, programId }: ReviewProgramClientProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingClients, setIsFetchingClients] = useState(false)
  const { user } = useCurrentUser()

  const fetchClients = async () => {
    if (!user) return

    setIsFetchingClients(true)
    try {
      console.log("[ReviewProgram] Fetching clients...")
      const response = await fetch("/api/clients")

      if (!response.ok) {
        throw new Error(`Failed to fetch clients: ${response.status}`)
      }

      const data = await response.json()
      console.log("[ReviewProgram] Clients response:", data)

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
    if (!user || selectedClients.length === 0) return

    setIsLoading(true)
    try {
      const result = await assignProgramToMultipleClients(programId, selectedClients, user.id, program)

      if (result.success) {
        toast({
          title: "Success!",
          description: `Program sent to ${selectedClients.length} client(s) successfully.`,
        })
        setIsDialogOpen(false)
        setSelectedClients([])
      } else {
        const failedCount = result.results.filter((r) => !r.success).length
        toast({
          title: "Partial Success",
          description: `Program sent to ${result.results.length - failedCount} client(s). ${failedCount} failed.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error sending program:", error)
      toast({
        title: "Error",
        description: "Failed to send program to clients. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClientToggle = (clientId: string) => {
    setSelectedClients((prev) => (prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]))
  }

  const totalExercises = program.weeks.reduce((total, week) => {
    return (
      total +
      week.workouts.reduce((weekTotal, workout) => {
        return weekTotal + workout.exercises.length
      }, 0)
    )
  }, 0)

  const totalWorkouts = program.weeks.reduce((total, week) => {
    return total + week.workouts.length
  }, 0)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Program Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{program.name}</h1>
              {program.description && <p className="text-gray-600 text-lg">{program.description}</p>}
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={fetchClients} className="flex items-center gap-2" disabled={!user}>
                  <Send className="h-4 w-4" />
                  Send to Client
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Send Program to Clients</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {isFetchingClients ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : clients.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No clients found</p>
                      <p className="text-sm">Add clients first to send programs</p>
                    </div>
                  ) : (
                    <>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {clients.map((client) => (
                          <div key={client.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                            <Checkbox
                              id={client.id}
                              checked={selectedClients.includes(client.id)}
                              onCheckedChange={() => handleClientToggle(client.id)}
                            />
                            <div className="flex-1">
                              <label htmlFor={client.id} className="text-sm font-medium cursor-pointer">
                                {client.name}
                              </label>
                              <p className="text-xs text-gray-500">{client.email}</p>
                            </div>
                            <Badge variant={client.status === "active" ? "default" : "secondary"}>
                              {client.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t">
                        <span className="text-sm text-gray-600">{selectedClients.length} client(s) selected</span>
                        <Button
                          onClick={handleSendToClients}
                          disabled={selectedClients.length === 0 || isLoading}
                          className="flex items-center gap-2"
                        >
                          {isLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          Send Program
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Program Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="flex items-center p-4">
                <Calendar className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Duration</p>
                  <p className="text-2xl font-bold">{program.duration} weeks</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center p-4">
                <Target className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Workouts</p>
                  <p className="text-2xl font-bold">{totalWorkouts}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center p-4">
                <Clock className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Exercises</p>
                  <p className="text-2xl font-bold">{totalExercises}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center p-4">
                <Users className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Weeks</p>
                  <p className="text-2xl font-bold">{program.weeks.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Program Content */}
        <div className="space-y-6">
          {program.weeks.map((week) => (
            <Card key={week.weekNumber}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Week {week.weekNumber}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {week.workouts.map((workout, workoutIndex) => (
                    <div key={workoutIndex} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        {workout.name}
                      </h4>
                      <div className="space-y-2">
                        {workout.exercises.map((exercise, exerciseIndex) => (
                          <div
                            key={exerciseIndex}
                            className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
                          >
                            <div className="flex-1">
                              <span className="font-medium">{exercise.name}</span>
                              {exercise.notes && <p className="text-sm text-gray-600 mt-1">{exercise.notes}</p>}
                            </div>
                            <div className="text-sm text-gray-600">
                              {exercise.sets} sets × {exercise.reps}
                              {exercise.weight && ` @ ${exercise.weight}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
