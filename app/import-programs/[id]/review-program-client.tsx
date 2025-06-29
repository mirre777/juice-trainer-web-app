"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Send, Users, Calendar, Target } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/hooks/use-toast"
import { assignProgramToClient } from "@/app/actions/program-assignment-actions"

interface Exercise {
  name: string
  sets: string
  reps: string
  weight?: string
  notes?: string
  restTime?: string
}

interface Workout {
  name: string
  exercises: Exercise[]
}

interface Week {
  weekNumber: number
  workouts: Workout[]
}

interface WorkoutProgram {
  id: string
  name: string
  description?: string
  weeks: Week[]
  totalWeeks: number
  createdAt: string
  status: "pending" | "approved" | "rejected"
}

interface Client {
  id: string
  name: string
  email: string
  avatar?: string
}

interface ReviewProgramClientProps {
  program: WorkoutProgram
}

export default function ReviewProgramClient({ program }: ReviewProgramClientProps) {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoadingClients, setIsLoadingClients] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const fetchClients = async () => {
    console.log("[ReviewProgram] Starting to fetch clients...")
    setIsLoadingClients(true)
    try {
      const response = await fetch("/api/clients")
      console.log("[ReviewProgram] API response status:", response.status)

      if (!response.ok) {
        throw new Error(`Failed to fetch clients: ${response.status}`)
      }

      const data = await response.json()
      console.log("[ReviewProgram] API response data:", data)

      if (data.clients && Array.isArray(data.clients)) {
        setClients(data.clients)
        console.log("[ReviewProgram] Set clients:", data.clients.length)
      } else {
        console.error("[ReviewProgram] Invalid response format:", data)
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
      setIsLoadingClients(false)
    }
  }

  const handleSendToClient = async () => {
    if (!selectedClient) {
      toast({
        title: "No client selected",
        description: "Please select a client to send the program to.",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)
    try {
      await assignProgramToClient(program.id, selectedClient.id)

      toast({
        title: "Program sent successfully!",
        description: `The program has been assigned to ${selectedClient.name}.`,
      })

      setIsDialogOpen(false)
      setSelectedClient(null)

      // Redirect to clients page or program list
      router.push("/clients")
    } catch (error) {
      console.error("Error sending program:", error)
      toast({
        title: "Error",
        description: "Failed to send program. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleDialogOpen = (open: boolean) => {
    setIsDialogOpen(open)
    if (open) {
      fetchClients()
    }
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{program.name}</h1>
          {program.description && <p className="text-muted-foreground mt-1">{program.description}</p>}
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Send to Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Send Program to Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {isLoadingClients ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : clients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No clients found. Add clients first to send programs.
                </div>
              ) : (
                <ScrollArea className="max-h-60">
                  <div className="space-y-2">
                    {clients.map((client) => (
                      <div
                        key={client.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedClient?.id === client.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/50"
                        }`}
                        onClick={() => setSelectedClient(client)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={client.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {client.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleSendToClient} disabled={!selectedClient || isSending}>
                  {isSending ? "Sending..." : "Send Program"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Program Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Calendar className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{program.totalWeeks}</p>
              <p className="text-sm text-muted-foreground">Weeks</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Target className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{totalWorkouts}</p>
              <p className="text-sm text-muted-foreground">Workouts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{totalExercises}</p>
              <p className="text-sm text-muted-foreground">Exercises</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Program Content */}
      <div className="space-y-6">
        {program.weeks.map((week) => (
          <Card key={week.weekNumber}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Week {week.weekNumber}
                <Badge variant="secondary">{week.workouts.length} workouts</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {week.workouts.map((workout, workoutIndex) => (
                <div key={workoutIndex}>
                  <h4 className="font-semibold text-lg mb-3">{workout.name}</h4>
                  <div className="space-y-2">
                    {workout.exercises.map((exercise, exerciseIndex) => (
                      <div key={exerciseIndex} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{exercise.name}</p>
                          {exercise.notes && <p className="text-sm text-muted-foreground mt-1">{exercise.notes}</p>}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span>{exercise.sets} sets</span>
                          <span>{exercise.reps} reps</span>
                          {exercise.weight && <span>{exercise.weight}</span>}
                          {exercise.restTime && (
                            <span className="text-muted-foreground">Rest: {exercise.restTime}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {workoutIndex < week.workouts.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
