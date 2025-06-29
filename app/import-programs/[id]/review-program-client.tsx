"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, Send, Users, Calendar, Target, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { assignProgramToClient } from "@/app/actions/program-assignment-actions"
import type { Client } from "@/types/client"

interface ReviewProgramClientProps {
  programData: any
  importId: string
}

export default function ReviewProgramClient({ programData, importId }: ReviewProgramClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)

  // Fetch clients when dialog opens
  useEffect(() => {
    if (isAssignDialogOpen) {
      fetchClients()
    }
  }, [isAssignDialogOpen])

  const fetchClients = async () => {
    try {
      setIsLoading(true)
      console.log("[ReviewProgram] Fetching clients...")

      const response = await fetch("/api/clients")
      const data = await response.json()

      console.log("[ReviewProgram] API Response:", data)

      if (response.ok && data.clients) {
        setClients(data.clients)
        console.log("[ReviewProgram] Loaded clients:", data.clients.length)
      } else {
        console.error("[ReviewProgram] Failed to fetch clients:", data.error)
        toast({
          title: "Error",
          description: "Failed to load clients. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[ReviewProgram] Error fetching clients:", error)
      toast({
        title: "Error",
        description: "Failed to load clients. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClientToggle = (clientId: string) => {
    setSelectedClients((prev) => (prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]))
  }

  const handleAssignProgram = async () => {
    if (selectedClients.length === 0) {
      toast({
        title: "No clients selected",
        description: "Please select at least one client to assign the program to.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsAssigning(true)
      console.log("[ReviewProgram] Assigning program to clients:", selectedClients)

      const selectedClientObjects = clients.filter((client) => selectedClients.includes(client.id))

      // Assign to each selected client
      const results = await Promise.allSettled(
        selectedClientObjects.map((client) => assignProgramToClient(programData, client.id, "current-trainer-id")),
      )

      const successful = results.filter((result) => result.status === "fulfilled").length
      const failed = results.length - successful

      if (successful > 0) {
        toast({
          title: "Program assigned successfully",
          description: `Program assigned to ${successful} client${successful > 1 ? "s" : ""}${
            failed > 0 ? `. ${failed} assignment${failed > 1 ? "s" : ""} failed.` : "."
          }`,
        })

        // Close dialog and reset selections
        setIsAssignDialogOpen(false)
        setSelectedClients([])

        // Navigate back to programs page
        router.push("/programs")
      } else {
        toast({
          title: "Assignment failed",
          description: "Failed to assign program to any clients. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[ReviewProgram] Error assigning program:", error)
      toast({
        title: "Error",
        description: "An error occurred while assigning the program. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAssigning(false)
    }
  }

  if (!programData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Program not found</h1>
          <Button onClick={() => router.push("/import-programs")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Import
          </Button>
        </div>
      </div>
    )
  }

  const totalWeeks = programData.weeks?.length || 0
  const totalWorkouts =
    programData.weeks?.reduce((acc: number, week: any) => acc + (week.workouts?.length || 0), 0) || 0
  const totalExercises =
    programData.weeks?.reduce(
      (acc: number, week: any) =>
        acc +
        (week.workouts?.reduce(
          (workoutAcc: number, workout: any) => workoutAcc + (workout.exercises?.length || 0),
          0,
        ) || 0),
      0,
    ) || 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.push("/import-programs")} variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{programData.name || "Untitled Program"}</h1>
            <p className="text-gray-600 mt-1">Review and assign this program to your clients</p>
          </div>
        </div>

        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#D2FF28] text-black hover:bg-[#c2ef18]">
              <Send className="mr-2 h-4 w-4" />
              Send to Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Program to Clients</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Select the clients you want to assign this program to:</p>

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">Loading clients...</p>
                </div>
              ) : clients.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600">No clients found</p>
                  <p className="text-xs text-gray-500 mt-1">Add clients first to assign programs</p>
                </div>
              ) : (
                <ScrollArea className="max-h-60">
                  <div className="space-y-2">
                    {clients.map((client) => (
                      <div key={client.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                        <Checkbox
                          id={client.id}
                          checked={selectedClients.includes(client.id)}
                          onCheckedChange={() => handleClientToggle(client.id)}
                        />
                        <div className="flex items-center space-x-3 flex-1">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                            style={{
                              backgroundColor: client.bgColor || "#f3f4f6",
                              color: client.textColor || "#374151",
                            }}
                          >
                            {client.initials || client.name?.substring(0, 2)?.toUpperCase() || "??"}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{client.name}</p>
                            <p className="text-xs text-gray-500">{client.email}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)} disabled={isAssigning}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignProgram}
                  disabled={selectedClients.length === 0 || isAssigning}
                  className="bg-[#D2FF28] text-black hover:bg-[#c2ef18]"
                >
                  {isAssigning ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Assign to {selectedClients.length} Client{selectedClients.length !== 1 ? "s" : ""}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Program Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{totalWeeks}</div>
            <div className="text-sm text-gray-600">Weeks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{totalWorkouts}</div>
            <div className="text-sm text-gray-600">Workouts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{totalExercises}</div>
            <div className="text-sm text-gray-600">Exercises</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">0</div>
            <div className="text-sm text-gray-600">Assigned</div>
          </CardContent>
        </Card>
      </div>

      {/* Program Details */}
      <Card>
        <CardHeader>
          <CardTitle>Program Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {programData.weeks?.map((week: any, weekIndex: number) => (
              <div key={weekIndex} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Week {weekIndex + 1}</h3>
                  <Badge variant="secondary">{week.workouts?.length || 0} workouts</Badge>
                </div>

                <div className="space-y-3">
                  {week.workouts?.map((workout: any, workoutIndex: number) => (
                    <div key={workoutIndex} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{workout.name || `Workout ${workoutIndex + 1}`}</h4>
                        <Badge variant="outline">{workout.exercises?.length || 0} exercises</Badge>
                      </div>

                      {workout.exercises && workout.exercises.length > 0 && (
                        <div className="text-sm text-gray-600">
                          <div className="flex flex-wrap gap-2">
                            {workout.exercises.slice(0, 3).map((exercise: any, exerciseIndex: number) => (
                              <span key={exerciseIndex} className="bg-white px-2 py-1 rounded text-xs">
                                {exercise.name || `Exercise ${exerciseIndex + 1}`}
                              </span>
                            ))}
                            {workout.exercises.length > 3 && (
                              <span className="text-xs text-gray-500">+{workout.exercises.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
