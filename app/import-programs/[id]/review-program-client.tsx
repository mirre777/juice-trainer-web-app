"use client"
import { ChevronLeft, Calendar, Send, ArrowLeft, Target, CheckCircle } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useClientDataAPI } from "@/lib/hooks/use-client-data-api"
import type { ClientType } from "@/types/client"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import Link from "next/link"

interface Exercise {
  name: string
  sets?: number
  reps?: string
  weight?: string
  rest?: string
  notes?: string
  weeks?: Array<{
    sets?: number
    reps?: string
    weight?: string
  }>
}

interface Routine {
  name: string
  exercises: Exercise[]
}

interface Week {
  week_number: number
  routines: Routine[]
}

interface Program {
  name: string
  description?: string
  duration_weeks?: number
  is_periodized?: boolean
  weeks?: Week[]
  routines?: Routine[]
}

interface ImportData {
  id: string
  program: Program
  status: string
  created_at: any
  trainer_id?: string
}

interface ReviewProgramClientProps {
  programData?: any
  importId?: string
  importData: any
  initialClients?: ClientType[]
}

export default function ReviewProgramClient({
  programData,
  importId,
  importData,
  initialClients = [],
}: ReviewProgramClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [programState, setProgramState] = useState<Program | null>(null)
  const [currentWeek, setCurrentWeek] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [showClientSelection, setShowClientSelection] = useState(false)
  const [messageToClient, setMessageToClient] = useState("")
  const [showSelectWeekDialog, setShowSelectWeekDialog] = useState(false)
  const [selectedWeekForNonPeriodized, setSelectedWeekForNonPeriodized] = useState<number | null>(null)
  const [expandedRoutines, setExpandedRoutines] = useState<{ [key: string]: boolean }>({ "0": true })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Client selection state - use server-side data first, then API as fallback
  const { clients: apiClients, loading: isLoadingClients, error: clientError, refetch } = useClientDataAPI()
  const [selectedClient, setSelectedClient] = useState<ClientType | null>(null)
  const [isSendingProgram, setIsSendingProgram] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [customMessage, setCustomMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  // Use initial clients from server, fallback to API clients
  const clients = initialClients.length > 0 ? initialClients : apiClients
  const clientsLoading = initialClients.length > 0 ? false : isLoadingClients
  const clientsError = initialClients.length > 0 ? null : clientError

  // Add logging when hasChanges state changes
  const setHasChangesWithLogging = (value: boolean) => {
    console.log("[ReviewProgramClient] hasChanges changing from", hasChanges, "to", value)
    setHasChanges(value)
  }

  // Initialize programState from importData on component mount or importData change
  useEffect(() => {
    console.log("[ReviewProgramClient] Component initializing with importData:", importData)
    console.log("[ReviewProgramClient] Initial clients provided:", initialClients.length)
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

      const initialProgram: Program = JSON.parse(JSON.stringify(importData.program))

      // Ensure program_weeks is a number, default to 4 if not present or invalid
      initialProgram.duration_weeks =
        Number.isInteger(initialProgram.duration_weeks) && initialProgram.duration_weeks > 0
          ? initialProgram.duration_weeks
          : 4

      initialProgram.name = importData.name || initialProgram.name || "Untitled Program"

      // Normalize data structure: Always use 'weeks' array and ensure set_numbers
      let normalizedWeeks: Week[] = []

      if (initialProgram.is_periodized) {
        if (initialProgram.weeks && Array.isArray(initialProgram.weeks) && initialProgram.weeks.length > 0) {
          normalizedWeeks = initialProgram.weeks
        } else if (
          initialProgram.routines &&
          Array.isArray(initialProgram.routines) &&
          initialProgram.routines.length > 0
        ) {
          for (let i = 0; i < initialProgram.duration_weeks; i++) {
            normalizedWeeks.push({
              week_number: i + 1,
              routines: JSON.parse(JSON.stringify(initialProgram.routines)),
            })
          }
        } else {
          for (let i = 0; i < initialProgram.duration_weeks; i++) {
            normalizedWeeks.push({
              week_number: i + 1,
              routines: [],
            })
          }
        }
      } else {
        if (initialProgram.weeks && Array.isArray(initialProgram.weeks) && initialProgram.weeks.length > 0) {
          normalizedWeeks = [initialProgram.weeks[0]]
        } else if (
          initialProgram.routines &&
          Array.isArray(initialProgram.routines) &&
          initialProgram.routines.length > 0
        ) {
          normalizedWeeks = [
            {
              week_number: 1,
              routines: JSON.parse(JSON.stringify(initialProgram.routines)),
            },
          ]
        } else {
          normalizedWeeks = [
            {
              week_number: 1,
              routines: [],
            },
          ]
        }
        initialProgram.duration_weeks = 1
      }

      // Normalize set_number for all exercises in all routines/weeks
      normalizedWeeks.forEach((week) => {
        if (week.routines && Array.isArray(week.routines)) {
          week.routines.forEach((routine) => {
            if (routine.exercises && Array.isArray(routine.exercises)) {
              routine.exercises.forEach((exercise) => {
                if (exercise.weeks && Array.isArray(exercise.weeks) && exercise.weeks.length > 0) {
                  // For periodized programs, iterate through each week's sets
                  exercise.weeks.forEach((exWeek) => {
                    if (exWeek.sets && Array.isArray(exWeek.sets)) {
                      exWeek.sets.forEach((set, setIndex) => {
                        if (typeof set.sets !== "number" || set.sets <= 0) {
                          set.sets = setIndex + 1
                        }
                      })
                    }
                  })
                } else if (exercise.sets && Array.isArray(exercise.sets)) {
                  // For non-periodized programs (or if 'weeks' is not used at exercise level), iterate through top-level sets
                  exercise.sets.forEach((set, setIndex) => {
                    if (typeof set.sets !== "number" || set.sets <= 0) {
                      set.sets = setIndex + 1
                    }
                  })
                }
              })
            }
          })
        }
      })

      setProgramState({
        ...initialProgram,
        weeks: normalizedWeeks,
        routines: [], // Ensure top-level routines are always empty
      })
      setCurrentWeek(1) // Always start at week 1 for display
      setHasChangesWithLogging(false)
      setJustSaved(false)
      setIsLoading(false)
    } catch (err) {
      console.error("Error initializing program state:", err)
      setError("Failed to load program data")
      setIsLoading(false)
    }
  }, [importData, initialClients.length])

  const toggleClientSelection = () => {
    console.log("[toggleClientSelection] Current state:", {
      showClientSelection,
      hasChanges,
      isSaving,
      clientsLength: clients.length,
      clientsLoading,
    })

    const newState = !showClientSelection
    console.log("[toggleClientSelection] Setting showClientSelection to:", newState)
    setShowClientSelection(newState)
  }

  // Derived state for current routines based on current week
  const currentRoutines: Routine[] = useMemo(() => {
    if (!programState || !programState.weeks || !Array.isArray(programState.weeks) || programState.weeks.length === 0)
      return []
    const currentWeekData = programState.weeks[currentWeek - 1]
    return currentWeekData?.routines || []
  }, [programState, currentWeek])

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
            <Calendar className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Program</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => router.push("/import-programs")} variant="outline">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Programs
          </Button>
        </div>
      </div>
    )
  }

  // No program state
  if (!programState) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <Calendar className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Program Data</h3>
          <p className="text-gray-500 mb-4">Unable to load program information.</p>
          <Button onClick={() => router.push("/import-programs")} variant="outline">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Programs
          </Button>
        </div>
      </div>
    )
  }

  // Handle sending program to client
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
      console.log("[ReviewProgramClient] Sending program to client:", {
        clientId: selectedClientId,
        clientName: selectedClient.name,
        programTitle: programData?.name || programState?.name,
        importId,
      })

      const response = await fetch("/api/programs/send-to-client", {
        method: "POST",
        credentials: "include", // Use same cookie-based auth as clients page
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: selectedClientId,
          programData: programData || programState,
          customMessage,
          importId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send program")
      }

      const result = await response.json()
      console.log("[ReviewProgramClient] Program sent successfully:", result)

      toast({
        title: "Program Sent Successfully!",
        description: `The program "${programData?.name || programState?.name}" has been sent to ${selectedClient.name}.`,
      })

      // Reset form
      setSelectedClientId("")
      setCustomMessage("")
    } catch (error) {
      console.error("[ReviewProgramClient] Error sending program:", error)
      toast({
        title: "Failed to Send Program",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const getRoutineCount = () => {
    return programData?.routines?.length || programState?.weeks?.[0]?.routines?.length || 0
  }

  const getTotalExercises = () => {
    const routines = programData?.routines || programState?.weeks?.[0]?.routines || []
    return routines.reduce((total: number, routine: any) => {
      return total + (routine.exercises?.length || 0)
    }, 0)
  }

  const getProgramWeeks = () => {
    return programData?.duration_weeks || programState?.duration_weeks || 0
  }

  const renderExercise = (exercise: Exercise, exerciseIndex: number) => (
    <div key={exerciseIndex} className="border rounded-lg p-4 bg-gray-50">
      <h4 className="font-medium text-gray-900 mb-2">{exercise.name}</h4>

      {programState?.is_periodized && exercise.weeks ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Periodized progression:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {exercise.weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="bg-white p-2 rounded border">
                <p className="text-xs font-medium text-gray-500">Week {weekIndex + 1}</p>
                <p className="text-sm">
                  {week.sets && `${week.sets} sets`}
                  {week.reps && ` × ${week.reps}`}
                  {week.weight && ` @ ${week.weight}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-600 space-y-1">
          {exercise.sets && <p>Sets: {exercise.sets}</p>}
          {exercise.reps && <p>Reps: {exercise.reps}</p>}
          {exercise.weight && <p>Weight: {exercise.weight}</p>}
          {exercise.rest && <p>Rest: {exercise.rest}</p>}
          {exercise.notes && <p>Notes: {exercise.notes}</p>}
        </div>
      )}
    </div>
  )

  const renderRoutine = (routine: Routine, routineIndex: number) => (
    <Card key={routineIndex} className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          {routine.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {routine.exercises?.map((exercise, exerciseIndex) => renderExercise(exercise, exerciseIndex))}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/import-programs">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Import
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Review & Send Program</h1>
          <p className="text-gray-600 mt-1">Review the imported workout program and send it to a client</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Program Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Program Overview
            </CardTitle>
            <CardDescription>Summary of the imported workout program</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{programData?.name || programState?.name || "Untitled Program"}</h3>
              {(programData?.description || programState?.description) && (
                <p className="text-gray-600 text-sm mt-1">{programData?.description || programState?.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">{getProgramWeeks()} Weeks</p>
                  <p className="text-xs text-gray-500">Duration</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">{getRoutineCount()} Routines</p>
                  <p className="text-xs text-gray-500">Workouts</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">{getTotalExercises()} exercises</span> across all routines
              </p>
            </div>

            {(programData?.routines || programState?.weeks?.[0]?.routines) && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Routines:</h4>
                <div className="flex flex-wrap gap-1">
                  {(programData?.routines || programState?.weeks?.[0]?.routines || [])
                    .slice(0, 3)
                    .map((routine: any, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {routine.name}
                      </Badge>
                    ))}
                  {(programData?.routines || programState?.weeks?.[0]?.routines || []).length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{(programData?.routines || programState?.weeks?.[0]?.routines || []).length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Send to Client */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-600" />
              Send to Client
            </CardTitle>
            <CardDescription>Choose a client and send this program</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Client Selection */}
            <div className="space-y-2">
              <Label htmlFor="client-select">Select Client</Label>
              {clientsLoading ? (
                <div className="flex items-center gap-2 p-3 border rounded-md">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <span className="text-sm text-gray-600">Loading clients...</span>
                </div>
              ) : clientsError ? (
                <div className="p-3 border border-red-200 rounded-md bg-red-50">
                  <p className="text-sm text-red-600">Error loading clients: {clientsError}</p>
                  <Button variant="outline" size="sm" onClick={refetch} className="mt-2 bg-transparent">
                    Retry
                  </Button>
                </div>
              ) : clients.length === 0 ? (
                <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
                  <p className="text-sm text-gray-600">No clients found. Add clients first to send programs.</p>
                  <Link href="/clients">
                    <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                      Go to Clients
                    </Button>
                  </Link>
                </div>
              ) : (
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger id="client-select">
                    <SelectValue placeholder="Choose a client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                            {client.initials}
                          </div>
                          <span>{client.name}</span>
                          <Badge variant="outline" className="ml-auto text-xs">
                            {client.status}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Custom Message */}
            <div className="space-y-2">
              <Label htmlFor="custom-message">Custom Message (Optional)</Label>
              <Textarea
                id="custom-message"
                placeholder="Add a personal message for your client..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
              />
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSendToClient}
              disabled={!selectedClientId || isSending || clientsLoading}
              className="w-full"
            >
              {isSending ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Sending Program...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Program to Client
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Program Content */}
      <div className="space-y-6 mt-8">
        {programState?.is_periodized
          ? // Periodized Program View
            programState.weeks?.map((week, weekIndex) => (
              <Card key={weekIndex}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Week {week.week_number || weekIndex + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {week.routines?.map((routine, routineIndex) => renderRoutine(routine, routineIndex))}
                  </div>
                </CardContent>
              </Card>
            ))
          : // Standard Program View
            programState?.weeks?.[0]?.routines?.map((routine, routineIndex) => renderRoutine(routine, routineIndex))}
      </div>

      {/* Debug Section - Server-side vs API client loading */}
      {process.env.NODE_ENV === "development" && (
        <Card className="mt-8 border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">Debug: Client Data Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-1">
              <p>
                <strong>Data Source:</strong> {initialClients.length > 0 ? "Server-side (SSR)" : "Client-side API"}
              </p>
              <p>
                <strong>Server Clients:</strong> {initialClients.length}
              </p>
              <p>
                <strong>API Clients:</strong> {apiClients.length}
              </p>
              <p>
                <strong>Active Clients:</strong> {clients.length}
              </p>
              <p>
                <strong>Loading:</strong> {clientsLoading ? "Yes" : "No"}
              </p>
              <p>
                <strong>Error:</strong> {clientsError || "None"}
              </p>
              <p>
                <strong>Selected Client:</strong> {selectedClientId || "None"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
