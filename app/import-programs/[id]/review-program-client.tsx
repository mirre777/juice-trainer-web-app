"use client"

import type React from "react"
import { ChevronLeft, Calendar, Send, ArrowLeft, Target, CheckCircle } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useClientDataAPI } from "@/lib/hooks/use-client-data-api"
import type { WorkoutProgram, WorkoutRoutine, ExerciseWeek, WorkoutSet } from "@/types/workout-program"
import type { Client } from "@/types/client"
import { updateDoc, doc, db } from "@/firebase/config" // Import updateDoc, doc, and db from firebase/config
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import Link from "next/link"

interface ReviewProgramClientProps {
  programData?: any
  importId?: string
  importData: any
  initialClients?: Client[]
}

export default function ReviewProgramClient({
  programData,
  importId,
  importData,
  initialClients = [],
}: ReviewProgramClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [programState, setProgramState] = useState<WorkoutProgram | null>(null)
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
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
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

      const initialProgram: WorkoutProgram = JSON.parse(JSON.stringify(importData.program))

      // Ensure program_weeks is a number, default to 4 if not present or invalid
      initialProgram.program_weeks =
        Number.isInteger(initialProgram.program_weeks) && initialProgram.program_weeks > 0
          ? initialProgram.program_weeks
          : 4

      initialProgram.program_title = importData.name || initialProgram.program_title || "Untitled Program"

      // Normalize data structure: Always use 'weeks' array and ensure set_numbers
      let normalizedWeeks: ExerciseWeek[] = []

      if (initialProgram.is_periodized) {
        if (initialProgram.weeks && Array.isArray(initialProgram.weeks) && initialProgram.weeks.length > 0) {
          normalizedWeeks = initialProgram.weeks
        } else if (
          initialProgram.routines &&
          Array.isArray(initialProgram.routines) &&
          initialProgram.routines.length > 0
        ) {
          for (let i = 0; i < initialProgram.program_weeks; i++) {
            normalizedWeeks.push({
              week_number: i + 1,
              set_count: 0,
              sets: [],
              routines: JSON.parse(JSON.stringify(initialProgram.routines)),
            })
          }
        } else {
          for (let i = 0; i < initialProgram.program_weeks; i++) {
            normalizedWeeks.push({
              week_number: i + 1,
              set_count: 0,
              sets: [],
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
              set_count: 0,
              sets: [],
              routines: JSON.parse(JSON.stringify(initialProgram.routines)),
            },
          ]
        } else {
          normalizedWeeks = [
            {
              week_number: 1,
              set_count: 0,
              sets: [],
              routines: [],
            },
          ]
        }
        initialProgram.program_weeks = 1
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
                        if (typeof set.set_number !== "number" || set.set_number <= 0) {
                          set.set_number = setIndex + 1
                        }
                      })
                    }
                  })
                } else if (exercise.sets && Array.isArray(exercise.sets)) {
                  // For non-periodized programs (or if 'weeks' is not used at exercise level), iterate through top-level sets
                  exercise.sets.forEach((set, setIndex) => {
                    if (typeof set.set_number !== "number" || set.set_number <= 0) {
                      set.set_number = setIndex + 1
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
  const currentRoutines: WorkoutRoutine[] = useMemo(() => {
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

  // Week navigation
  const goToPreviousWeek = () => setCurrentWeek(Math.max(1, currentWeek - 1))
  const goToNextWeek = () => setCurrentWeek(Math.min(programState?.program_weeks || 1, currentWeek + 1))

  // Handle changes to program title and notes
  const handleProgramTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProgramState((prev) => {
      if (!prev) return prev
      return { ...prev, program_title: e.target.value }
    })
    setHasChangesWithLogging(true)
    setJustSaved(false)
  }

  const handleProgramNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setProgramState((prev) => {
      if (!prev) return prev
      return { ...prev, program_notes: e.target.value }
    })
    setHasChangesWithLogging(true)
    setJustSaved(false)
  }

  // Handle changes to program weeks (only relevant for periodized programs)
  const handleProgramWeeksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWeeksCount = Number.parseInt(e.target.value, 10)
    if (isNaN(newWeeksCount) || newWeeksCount < 1) return

    setProgramState((prev) => {
      if (!prev) return null

      const updatedProgram = { ...prev, program_weeks: newWeeksCount }

      if (updatedProgram.is_periodized) {
        const currentWeeks = updatedProgram.weeks || []
        const newWeeksArray: ExerciseWeek[] = []

        for (let i = 0; i < newWeeksCount; i++) {
          if (currentWeeks[i]) {
            newWeeksArray.push(currentWeeks[i])
          } else {
            // Copy the last available week's data, or create empty if no weeks exist
            const lastWeekData = currentWeeks[currentWeeks.length - 1] || { routines: [] }
            newWeeksArray.push({
              week_number: i + 1,
              set_count: 0, // Will be derived
              sets: [], // Will be derived
              routines: JSON.parse(JSON.stringify(lastWeekData.routines)), // Deep copy
            })
          }
        }
        updatedProgram.weeks = newWeeksArray
        // Adjust currentWeek if it's now out of bounds
        if (currentWeek > newWeeksCount) {
          setCurrentWeek(newWeeksCount)
        }
      }
      return updatedProgram
    })
    setHasChangesWithLogging(true)
    setJustSaved(false)
  }

  // Toggle between periodized and non-periodized
  const togglePeriodization = () => {
    if (!programState) return

    setHasChangesWithLogging(true)
    setJustSaved(false)

    if (programState.is_periodized) {
      // Switching from Periodized to Non-Periodized
      setShowSelectWeekDialog(true) // Open dialog to select which week to keep
    } else {
      // Switching from Non-Periodized to Periodized
      const currentSingleWeekRoutines = programState.weeks?.[0]?.routines || []
      const newWeeks: ExerciseWeek[] = []
      const defaultWeeks = programState.program_weeks > 0 ? programState.program_weeks : 4 // Use existing weeks or default to 4

      for (let i = 0; i < defaultWeeks; i++) {
        newWeeks.push({
          week_number: i + 1,
          set_count: 0, // Will be derived from exercises
          sets: [], // Will be derived from exercises
          routines: JSON.parse(JSON.stringify(currentSingleWeekRoutines)), // Deep copy routines
        })
      }

      setProgramState((prev) => {
        if (!prev) return null
        return {
          ...prev,
          is_periodized: true,
          weeks: newWeeks,
          program_weeks: defaultWeeks, // Update program_weeks
        }
      })
      setCurrentWeek(1) // Reset current week to 1
    }
  }

  // Handle selection of week when switching from periodized to non-periodized
  const handleSelectWeekForNonPeriodized = (weekNumber: number) => {
    if (!programState || !programState.weeks) return

    const selectedWeekData = programState.weeks.find((w) => w.week_number === weekNumber)
    if (selectedWeekData) {
      setProgramState((prev) => {
        if (!prev) return null
        return {
          ...prev,
          is_periodized: false,
          weeks: [JSON.parse(JSON.stringify(selectedWeekData))], // Keep only the selected week
          program_weeks: 1, // Non-periodized always has 1 week
        }
      })
      setShowSelectWeekDialog(false)
      setCurrentWeek(1) // Reset current week for display purposes
      setHasChangesWithLogging(true)
      setJustSaved(false)
    }
  }

  const handleSaveChanges = async () => {
    if (!programState) return

    setIsSaving(true)
    try {
      await updateDoc(doc(db, "sheets_imports", importData.id), {
        name: programState.program_title,
        program: programState, // Save the entire programState object
        status: "reviewed",
        updatedAt: new Date(),
      })
      setHasChangesWithLogging(false)
      setJustSaved(true)
      // Re-initialize importData to reflect the saved state for correct revert behavior
      // In a real app, you might refetch importData or update it via a parent callback
      importData.program = JSON.parse(JSON.stringify(programState))
    } catch (error) {
      console.error("Error saving program:", error)
      alert("Failed to save changes. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const revertChanges = () => {
    if (importData?.program) {
      const initialProgram: WorkoutProgram = JSON.parse(JSON.stringify(importData.program))
      setProgramState(initialProgram)
      setCurrentWeek(1)
      setHasChangesWithLogging(false)
      setJustSaved(false)
      setExpandedRoutines({ "0": true }) // Reset expanded routines
    }
  }

  // Add empty set to exercise
  const addSet = (routineIndex: number, exerciseIndex: number) => {
    setProgramState((prev) => {
      if (!prev) return null
      const updatedProgram = JSON.parse(JSON.stringify(prev)) // Deep copy for immutability

      // Always access through the weeks array
      const targetExercise = updatedProgram.weeks[currentWeek - 1]?.routines[routineIndex]?.exercises[exerciseIndex]

      if (targetExercise) {
        const newSetNumber = (targetExercise.sets?.length || 0) + 1
        const newSet: WorkoutSet = {
          set_number: newSetNumber,
          warmup: false,
          reps: "",
          weight: "",
          rpe: "",
          rest: "",
          duration_sec: null, // Use duration_sec as per type
          notes: null, // Use notes as per type
        }
        if (!targetExercise.sets) targetExercise.sets = []
        targetExercise.sets.push(newSet)
      }
      return updatedProgram
    })
    setHasChangesWithLogging(true)
    setJustSaved(false)
  }

  // Duplicate specific set
  const duplicateSet = (routineIndex: number, exerciseIndex: number, setIndex: number) => {
    setProgramState((prev) => {
      if (!prev) return null
      const updatedProgram = JSON.parse(JSON.stringify(prev))

      // Always access through the weeks array
      const targetExercise = updatedProgram.weeks[currentWeek - 1]?.routines[routineIndex]?.exercises[exerciseIndex]

      if (targetExercise && targetExercise.sets && targetExercise.sets[setIndex]) {
        const setToDuplicate = targetExercise.sets[setIndex]
        const duplicatedSet = {
          ...setToDuplicate,
          set_number: setToDuplicate.set_number + 1,
        }

        targetExercise.sets.splice(setIndex + 1, 0, duplicatedSet)
        targetExercise.sets.forEach((set, index) => {
          set.set_number = index + 1
        })
      }
      return updatedProgram
    })
    setHasChangesWithLogging(true)
    setJustSaved(false)
  }

  // Delete set
  const deleteSet = (routineIndex: number, exerciseIndex: number, setIndex: number) => {
    setProgramState((prev) => {
      if (!prev) return null
      const updatedProgram = JSON.parse(JSON.stringify(prev))

      // Always access through the weeks array
      const targetExercise = updatedProgram.weeks[currentWeek - 1]?.routines[routineIndex]?.exercises[exerciseIndex]

      if (targetExercise && targetExercise.sets) {
        targetExercise.sets.splice(setIndex, 1)
        targetExercise.sets.forEach((set, index) => {
          set.set_number = index + 1
        })
      }
      return updatedProgram
    })
    setHasChangesWithLogging(true)
    setJustSaved(false)
  }

  const updateSetField = (routineIndex: number, exerciseIndex: number, setIndex: number, field: string, value: any) => {
    setProgramState((prev) => {
      if (!prev) return null
      const updatedProgram = JSON.parse(JSON.stringify(prev)) // Deep copy for immutability

      // Always access through the weeks array
      const weekData = updatedProgram.weeks[currentWeek - 1]
      if (weekData && weekData.routines[routineIndex]?.exercises[exerciseIndex]?.sets[setIndex]) {
        weekData.routines[routineIndex].exercises[exerciseIndex].sets[setIndex][field] = value
      }
      return updatedProgram
    })
    setHasChangesWithLogging(true)
    setJustSaved(false)
  }

  const toggleRoutine = (index: number) => {
    setExpandedRoutines((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  const getRoutineColor = (index: number) => {
    const colors = ["bg-orange-500", "bg-blue-500", "bg-purple-500", "bg-green-500", "bg-pink-500", "bg-yellow-500"]
    return colors[index % colors.length]
  }

  // Handle sending program to client
  const handleSendToClientOld = async () => {
    if (!selectedClient || !programState) return

    setIsSendingProgram(true)
    try {
      console.log("[handleSendToClient] Sending program to client:", selectedClient.name)

      const response = await fetch("/api/programs/send-to-client", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          programData: programState,
          clientId: selectedClient.id,
          message: messageToClient,
        }),
      })

      const result = await response.json()
      console.log("[handleSendToClient] Response:", result)

      if (response.ok && result.success) {
        toast({
          title: "Success!",
          description: `Program "${programState.program_title}" sent to ${selectedClient.name} successfully!`,
        })
        setShowClientSelection(false)
        setSelectedClient(null)
        setMessageToClient("")
      } else {
        throw new Error(result.error || "Failed to send program")
      }
    } catch (error) {
      console.error("[handleSendToClient] Error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send program to client",
        variant: "destructive",
      })
    } finally {
      setIsSendingProgram(false)
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
      console.log("[ReviewProgramClient] Sending program to client:", {
        clientId: selectedClientId,
        clientName: selectedClient.name,
        programTitle: programData?.program_title || programState?.program_title,
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
        description: `The program "${programData?.program_title || programState?.program_title}" has been sent to ${selectedClient.name}.`,
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
    return programData?.program_weeks || programState?.program_weeks || 0
  }

  // Log client loading for debugging
  const logClientLoading = () => {
    console.log("[ReviewProgramClient] Client loading state:", {
      clientsLoading,
      clientCount: clients.length,
      clientsError,
      selectedClientId,
      initialClientsCount: initialClients.length,
      usingServerData: initialClients.length > 0,
    })
  }

  // Debug Section - Server-side vs API client loading
  const debugSection = (
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
  )

  // Confirmation Dialog for Unsaved Changes
  const confirmDialog = (
    <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unsaved Changes</DialogTitle>
          <DialogDescription>
            You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
            Continue Editing
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setHasChangesWithLogging(false) // Ensure changes are marked as discarded
              router.push("/import-programs")
            }}
          >
            Leave Without Saving
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  // Select Week Dialog for switching from Periodized to Non-Periodized
  const selectWeekDialog = (
    <Dialog open={showSelectWeekDialog} onOpenChange={setShowSelectWeekDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Week to Keep</DialogTitle>
          <DialogDescription>
            You are switching from a periodized program to a non-periodized program. Please select which week's data you
            would like to keep as the single routine for this program.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-4">
          {programState.weeks?.map((week) => (
            <Button
              key={week.week_number}
              variant={selectedWeekForNonPeriodized === week.week_number ? "default" : "outline"}
              onClick={() => setSelectedWeekForNonPeriodized(week.week_number)}
              className="justify-start"
            >
              Week {week.week_number} ({week.routines?.length || 0} routines)
            </Button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowSelectWeekDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (selectedWeekForNonPeriodized) {
                handleSelectWeekForNonPeriodized(selectedWeekForNonPeriodized)
              }
            }}
            disabled={!selectedWeekForNonPeriodized}
          >
            Keep Week {selectedWeekForNonPeriodized}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
              <h3 className="font-semibold text-lg">
                {programData?.program_title || programState?.program_title || "Untitled Program"}
              </h3>
              {(programData?.program_notes || programState?.program_notes) && (
                <p className="text-gray-600 text-sm mt-1">
                  {programData?.program_notes || programState?.program_notes}
                </p>
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
                        {routine.routine_name}
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

      {process.env.NODE_ENV === "development" && debugSection}

      {confirmDialog}

      {selectWeekDialog}
    </div>
  )
}
