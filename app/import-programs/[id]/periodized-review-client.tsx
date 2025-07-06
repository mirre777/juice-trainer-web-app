"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ChevronDown, ChevronUp, Copy, Trash2, RotateCcw } from "lucide-react"
import Link from "next/link"

interface Exercise {
  name: string
  sets?: number
  reps?: string
  weight?: string
  rest?: string
  notes?: string
  rpe?: string
  weeks?: Array<{
    week_number: number
    sets?: Array<{
      reps?: string
      weight?: string
      rpe?: string
      rest?: string
      notes?: string
    }>
  }>
}

interface Routine {
  name?: string
  title?: string
  exercises: Exercise[]
}

interface Week {
  week_number: number
  routines: Routine[]
}

interface Program {
  name?: string
  program_title?: string
  description?: string
  duration_weeks?: number
  program_weeks?: number
  is_periodized?: boolean
  weeks?: Week[]
  routines?: Routine[]
  notes?: string
}

interface Client {
  id: string
  name: string
  email?: string
  status?: string
  initials?: string
}

interface PeriodizedReviewClientProps {
  importData: any
  importId?: string
  initialClients?: Client[]
}

export default function PeriodizedReviewClient({
  importData,
  importId,
  initialClients = [],
}: PeriodizedReviewClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [programState, setProgramState] = useState<Program | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [customMessage, setCustomMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [clientsLoading, setClientsLoading] = useState(false)
  const [clientsError, setClientsError] = useState<string | null>(null)
  const [expandedRoutines, setExpandedRoutines] = useState<{ [key: number]: boolean }>({})
  const [showSendToClient, setShowSendToClient] = useState(false)

  // Initialize programState from importData on component mount
  useEffect(() => {
    console.log("[PeriodizedReviewClient] Component initializing with importData:", importData)
    console.log("[PeriodizedReviewClient] Initial clients provided:", initialClients.length)

    try {
      setIsLoading(true)
      setError(null)

      if (!importData) {
        setError("No import data provided")
        setIsLoading(false)
        return
      }

      if (!importData.program) {
        setError("No program data found in import")
        setIsLoading(false)
        return
      }

      // Use the actual imported program data
      const actualProgram: Program = JSON.parse(JSON.stringify(importData.program))

      // Set reasonable defaults if missing
      actualProgram.duration_weeks =
        Number.isInteger(actualProgram.duration_weeks) && actualProgram.duration_weeks > 0
          ? actualProgram.duration_weeks
          : actualProgram.program_weeks || actualProgram.weeks?.length || 1

      // Use the import name or program name
      actualProgram.name = importData.name || actualProgram.program_title || actualProgram.name || "Untitled Program"

      console.log("[PeriodizedReviewClient] Setting actual program state:", {
        name: actualProgram.name,
        duration_weeks: actualProgram.duration_weeks,
        hasWeeks: !!actualProgram.weeks,
        hasRoutines: !!actualProgram.routines,
        weeksLength: actualProgram.weeks?.length,
        routinesLength: actualProgram.routines?.length,
      })

      setProgramState(actualProgram)

      // Auto-expand first routine
      setExpandedRoutines({ 0: true })

      setIsLoading(false)
    } catch (err) {
      console.error("Error initializing program state:", err)
      setError("Failed to load program data")
      setIsLoading(false)
    }
  }, [importData])

  // Fetch clients if not provided initially
  useEffect(() => {
    if (initialClients.length === 0) {
      fetchClientsFromAPI()
    } else {
      setClients(initialClients)
    }
  }, [initialClients])

  const fetchClientsFromAPI = async () => {
    setClientsLoading(true)
    setClientsError(null)

    try {
      const response = await fetch("/api/clients", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
        console.log("[PeriodizedReviewClient] Fetched clients from API:", data.clients?.length || 0)
      } else {
        throw new Error("Failed to fetch clients")
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
      setClientsError(error instanceof Error ? error.message : "Failed to fetch clients")
    } finally {
      setClientsLoading(false)
    }
  }

  const handleSaveChanges = async () => {
    if (!programState || !importId) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/sheets-imports/${importId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          program: programState,
          name: programState.name || programState.program_title,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save changes")
      }

      toast({
        title: "Changes Saved",
        description: "Your program changes have been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving changes:", error)
      toast({
        title: "Save Failed",
        description: "Failed to save your changes. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendToClient = async () => {
    if (!selectedClientId) {
      toast({
        title: "No Client Selected",
        description: "Please select a client to send the program to.",
        variant: "destructive",
      })
      return
    }

    const selectedClient = clients.find((c) => c.id === selectedClientId)
    if (!selectedClient) {
      toast({
        title: "Client Not Found",
        description: "The selected client could not be found.",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)

    try {
      const response = await fetch("/api/programs/send-to-client", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: selectedClientId,
          programData: programState,
          customMessage,
          importId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send program")
      }

      toast({
        title: "Program Sent Successfully!",
        description: `The program "${programState?.name || programState?.program_title}" has been sent to ${selectedClient.name}.`,
      })

      setSelectedClientId("")
      setCustomMessage("")
      setShowSendToClient(false)
    } catch (error) {
      console.error("[PeriodizedReviewClient] Error sending program:", error)
      toast({
        title: "Failed to Send Program",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const toggleRoutineExpansion = (index: number) => {
    setExpandedRoutines((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const updateProgramField = (field: keyof Program, value: any) => {
    if (!programState) return
    setProgramState((prev) => ({
      ...prev!,
      [field]: value,
    }))
  }

  const updateExercise = (routineIndex: number, exerciseIndex: number, field: keyof Exercise, value: any) => {
    if (!programState) return

    setProgramState((prev) => {
      const newState = { ...prev! }
      const routines = newState.routines || newState.weeks?.[0]?.routines || []

      if (routines[routineIndex]?.exercises[exerciseIndex]) {
        routines[routineIndex].exercises[exerciseIndex] = {
          ...routines[routineIndex].exercises[exerciseIndex],
          [field]: value,
        }
      }

      return newState
    })
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading program...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <div className="mx-auto h-12 w-12 rounded-full border-2 border-red-200 flex items-center justify-center">
              <span className="text-2xl">😞</span>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Program</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => router.push("/import-programs")} variant="outline">
            Back to Programs
          </Button>
        </div>
      </div>
    )
  }

  if (!programState) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <div className="mx-auto h-12 w-12 rounded-full border-2 border-gray-200 flex items-center justify-center">
              <span className="text-2xl">😞</span>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Program Not Found</h3>
          <p className="text-gray-500 mb-4">
            We couldn't find the workout program you're looking for. It might have been deleted or the link is
            incorrect.
          </p>
          <Button onClick={() => router.push("/import-programs")} className="bg-green-500 hover:bg-green-600">
            Go to Import Programs
          </Button>
        </div>
      </div>
    )
  }

  const routines = programState.routines || programState.weeks?.[0]?.routines || []

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/import-programs">
            <Button variant="outline" size="sm">
              ← Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Review Program</h1>
            <p className="text-gray-600">Review and edit the imported workout program before saving</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/import-programs")}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Revert
          </Button>
          <Button onClick={handleSaveChanges} disabled={isSaving} className="bg-green-500 hover:bg-green-600">
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
          <Button onClick={() => setShowSendToClient(!showSendToClient)} className="bg-blue-600 hover:bg-blue-700">
            Send to Client
          </Button>
        </div>
      </div>

      {/* Send to Client Section */}
      {showSendToClient && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Send to Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client-select">Select Client</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex items-center gap-2">
                          <span>{client.initials || client.name?.charAt(0) || "?"}</span>
                          <span>{client.name}</span>
                          <Badge variant="outline" className="ml-auto text-xs">
                            {client.status || "Active"}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="custom-message">Custom Message (Optional)</Label>
                <Textarea
                  id="custom-message"
                  placeholder="Add a personal message..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <Button
              onClick={handleSendToClient}
              disabled={!selectedClientId || isSending}
              className="w-full bg-green-500 hover:bg-green-600"
            >
              {isSending ? "Sending..." : "Send Program to Client"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Program Details */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <Label htmlFor="program-title">Program Title</Label>
          <Input
            id="program-title"
            value={programState.name || programState.program_title || ""}
            onChange={(e) => updateProgramField("name", e.target.value)}
            placeholder="Enter program title..."
          />
        </div>
        <div>
          <Label htmlFor="program-weeks">Program Weeks</Label>
          <Input
            id="program-weeks"
            type="number"
            value={programState.duration_weeks || programState.program_weeks || 1}
            onChange={(e) => updateProgramField("duration_weeks", Number.parseInt(e.target.value) || 1)}
            min="1"
          />
        </div>
      </div>

      <div className="mb-6">
        <Label htmlFor="program-notes">Program Notes</Label>
        <Textarea
          id="program-notes"
          value={programState.notes || ""}
          onChange={(e) => updateProgramField("notes", e.target.value)}
          placeholder="Add notes about this program..."
          rows={3}
        />
      </div>

      {/* Periodization Toggle */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Periodization</h3>
              <p className="text-sm text-gray-600">Some routine repeated each week</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={programState.is_periodized || false}
                onCheckedChange={(checked) => updateProgramField("is_periodized", checked)}
              />
              <span className="text-sm">Switch to Periodized</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercise Routines */}
      {routines.map((routine, routineIndex) => (
        <Card key={routineIndex} className="mb-4">
          <CardHeader className="cursor-pointer" onClick={() => toggleRoutineExpansion(routineIndex)}>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm">
                  {routine.exercises?.length || 0}
                </div>
                {routine.exercises?.length || 0} exercises
              </CardTitle>
              {expandedRoutines[routineIndex] ? <ChevronUp /> : <ChevronDown />}
            </div>
          </CardHeader>

          {expandedRoutines[routineIndex] && (
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Exercise</th>
                      <th className="text-left p-2">Set</th>
                      <th className="text-left p-2">Reps</th>
                      <th className="text-left p-2">Weight</th>
                      <th className="text-left p-2">RPE</th>
                      <th className="text-left p-2">Rest</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routine.exercises?.map((exercise, exerciseIndex) => {
                      const sets = exercise.sets || 1
                      return Array.from({ length: sets }, (_, setIndex) => (
                        <tr key={`${exerciseIndex}-${setIndex}`} className="border-b">
                          {setIndex === 0 && (
                            <td rowSpan={sets} className="p-2 font-medium border-r">
                              {exercise.name}
                            </td>
                          )}
                          <td className="p-2">{setIndex + 1}</td>
                          <td className="p-2">
                            <Input
                              value={exercise.reps || ""}
                              onChange={(e) => updateExercise(routineIndex, exerciseIndex, "reps", e.target.value)}
                              className="w-16 h-8"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              value={exercise.weight || ""}
                              onChange={(e) => updateExercise(routineIndex, exerciseIndex, "weight", e.target.value)}
                              className="w-16 h-8"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              value={exercise.rpe || ""}
                              onChange={(e) => updateExercise(routineIndex, exerciseIndex, "rpe", e.target.value)}
                              className="w-16 h-8"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              value={exercise.rest || ""}
                              onChange={(e) => updateExercise(routineIndex, exerciseIndex, "rest", e.target.value)}
                              className="w-20 h-8"
                            />
                          </td>
                          {setIndex === 0 && (
                            <td rowSpan={sets} className="p-2">
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm">
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  )
}
