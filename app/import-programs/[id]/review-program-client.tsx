"use client"

import type React from "react"
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Copy,
  Trash2,
  Calendar,
  RotateCcw,
  Plus,
  Check,
  Info,
  Save,
  Send,
  ChevronUp,
} from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { User } from "@/components/icons/user"
import { useToast } from "@/hooks/use-toast"
import type { WorkoutProgram, WorkoutRoutine, ExerciseWeek, WorkoutSet } from "@/types/workout-program"
import type { Client } from "@/types/client"

interface ReviewProgramClientProps {
  importData: any
}

export default function ReviewProgramClient({ importData }: ReviewProgramClientProps) {
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

  // Client selection state
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isLoadingClients, setIsLoadingClients] = useState(false)
  const [isSendingProgram, setIsSendingProgram] = useState(false)

  // Add logging when hasChanges state changes
  const setHasChangesWithLogging = (value: boolean) => {
    console.log("[ReviewProgramClient] hasChanges changing from", hasChanges, "to", value)
    setHasChanges(value)
  }

  // Initialize programState from importData on component mount or importData change
  useEffect(() => {
    console.log("[ReviewProgramClient] Component initializing with importData:", importData)
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
  }, [importData])

  // Load clients on component mount
  useEffect(() => {
    console.log("[useEffect] Component mounted, calling fetchClients...")
    fetchClientsDirectly()
  }, [])

  // Fetch clients using the API route instead of direct service call
  const fetchClientsDirectly = async () => {
    console.log("[fetchClientsDirectly] === STARTING API CLIENT FETCH ===")

    setIsLoadingClients(true)
    try {
      console.log("[fetchClientsDirectly] Calling /api/clients...")

      const response = await fetch("/api/clients", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("[fetchClientsDirectly] API response status:", response.status)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log("[fetchClientsDirectly] API response:", result)

      if (result.success && result.clients) {
        console.log("[fetchClientsDirectly] Successfully fetched clients:", result.clients.length)
        setClients(result.clients)
      } else {
        console.log("[fetchClientsDirectly] API returned no clients or error:", result.error)
        setClients([])
        if (result.error) {
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("[fetchClientsDirectly] ❌ Error occurred:", error)
      console.error("[fetchClientsDirectly] Error details:", {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      })
      toast({
        title: "Error",
        description: "Failed to load clients. Please try again.",
        variant: "destructive",
      })
      setClients([])
    } finally {
      setIsLoadingClients(false)
      console.log("[fetchClientsDirectly] === API CLIENT FETCH COMPLETE ===")
    }
  }

  const toggleClientSelection = () => {
    console.log("[toggleClientSelection] Current state:", {
      showClientSelection,
      hasChanges,
      isSaving,
      clientsLength: clients.length,
      isLoadingClients,
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
  const handleSendToClient = async () => {
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center mb-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-gray-700"
          onClick={() => {
            if (hasChanges) {
              setShowConfirmDialog(true)
            } else {
              router.push("/import-programs")
            }
          }}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Program</h1>
          <p className="text-gray-500 text-sm">Review and edit the imported workout program before saving</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={revertChanges}
            disabled={!hasChanges || isSaving}
            className="flex items-center gap-2 text-gray-700 hover:bg-gray-100"
          >
            <RotateCcw className="h-4 w-4" />
            Revert
          </Button>
          <Button
            className={
              justSaved && !hasChanges
                ? "bg-lime-400 text-gray-800 cursor-not-allowed opacity-75 flex items-center gap-2"
                : "bg-lime-400 hover:bg-lime-500 text-gray-800 flex items-center gap-2"
            }
            onClick={handleSaveChanges}
            disabled={isSaving || (justSaved && !hasChanges)}
          >
            {isSaving ? (
              "Saving..."
            ) : justSaved && !hasChanges ? (
              <>
                <Check className="h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
          <Button
            className={`${
              hasChanges || isSaving ? "bg-gray-400 cursor-not-allowed" : "bg-gray-900 hover:bg-gray-800"
            } text-white flex items-center gap-2`}
            onClick={toggleClientSelection}
            disabled={hasChanges || isSaving}
            title={hasChanges || isSaving ? "Save changes first before sending to client" : "Send program to client"}
          >
            <Send className="h-4 w-4" />
            Send to Client
            {(hasChanges || isSaving) && <span className="text-xs ml-1">(Save first)</span>}
          </Button>
        </div>
      </div>

      {/* Display Fetched Clients - Debug Section */}
      <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
        <h4 className="font-medium text-blue-800 mb-3">
          Fetched Clients ({clients.length}) {isLoadingClients && "(Loading...)"}
        </h4>
        {isLoadingClients ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-blue-600 text-sm">Loading clients...</span>
          </div>
        ) : clients.length === 0 ? (
          <div className="text-blue-700 text-sm">No clients found</div>
        ) : (
          <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
            {clients.map((client, index) => (
              <div
                key={client.id || index}
                className="bg-white p-2 rounded border border-blue-200"
                style={{ fontSize: "8px" }}
              >
                <div className="font-medium text-gray-900 truncate">{client.name || "No Name"}</div>
                <div className="text-gray-600 truncate">{client.email || "No Email"}</div>
                <div className="text-gray-500">Status: {client.status || "No Status"}</div>
                <div className="text-gray-500">ID: {client.userId || "No UserID"}</div>
                <div className="text-gray-500">Linked: {client.hasLinkedAccount ? "Yes" : "No"}</div>
              </div>
            ))}
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          className="mt-2 bg-transparent text-blue-700 border-blue-300"
          onClick={fetchClientsDirectly}
        >
          Refresh Clients
        </Button>
      </Card>

      {/* Program Settings */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="program-title" className="block text-sm font-medium text-gray-700 mb-1">
              Program Title
            </label>
            <Input
              id="program-title"
              value={programState.program_title || ""}
              onChange={handleProgramTitleChange}
              className="w-full border-transparent focus:border-lime-500"
            />
          </div>
          <div>
            <label htmlFor="program-weeks" className="block text-sm font-medium text-gray-700 mb-1">
              Program Weeks
            </label>
            <Input
              id="program-weeks"
              type="number"
              value={programState.program_weeks || 1}
              onChange={handleProgramWeeksChange}
              className="w-full border-transparent focus:border-lime-500"
              min={1}
              disabled={!programState.is_periodized} // Disable if not periodized
            />
          </div>
        </div>

        {/* Program Notes */}
        <div className="mb-8">
          <label htmlFor="program-notes" className="block text-sm font-medium text-gray-700 mb-1">
            Program Notes
          </label>
          <Textarea
            id="program-notes"
            value={programState.program_notes || ""}
            onChange={handleProgramNotesChange}
            className="w-full min-h-[100px] border-transparent focus:border-lime-500"
            placeholder="Add notes about this program..."
          />
        </div>

        {/* Periodization Toggle */}
        <div className="mb-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">Periodization</h3>
              <p className="text-sm text-gray-500">
                {programState.is_periodized
                  ? "Program changes week by week with different training variables"
                  : "Same routine repeated each week"}
              </p>
            </div>
            <Button
              variant={programState.is_periodized ? "default" : "outline"}
              onClick={togglePeriodization}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              {programState.is_periodized ? "Switch to Non-Periodized" : "Switch to Periodized"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Week Navigation (only show if periodized) */}
      {programState.is_periodized && (
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={goToPreviousWeek} disabled={currentWeek === 1}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <div className="flex-1 text-center">
              <div className="text-lg font-semibold">
                Week {currentWeek}/{programState.program_weeks}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextWeek}
              disabled={currentWeek === programState.program_weeks}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>

          {/* Week selector dots */}
          <div className="flex justify-center mt-4 gap-1">
            {Array.from({ length: programState.program_weeks }, (_, i) => i + 1).map((week) => (
              <button
                key={week}
                onClick={() => setCurrentWeek(week)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  week === currentWeek ? "bg-lime-500" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Routines for Current Week / Non-Periodized Program */}
      {currentRoutines && currentRoutines.length > 0 ? (
        <div className="space-y-4">
          {currentRoutines.map((routine, routineIndex) => (
            <div key={routineIndex} className="border border-gray-200 rounded-lg overflow-hidden">
              <div
                className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
                onClick={() => toggleRoutine(routineIndex)}
              >
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full ${getRoutineColor(routineIndex)} flex items-center justify-center text-white mr-3`}
                  >
                    {routine.routine_name?.charAt(0) || "R"}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{routine.routine_name}</h3>
                    <p className="text-sm text-gray-500">
                      {routine.exercises?.length || 0} exercises
                      {programState.is_periodized && ` • Week ${currentWeek} view`}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  {expandedRoutines[routineIndex] ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </Button>
              </div>

              {expandedRoutines[routineIndex] && (
                <div className="p-4">
                  {routine.exercises && routine.exercises.length > 0 ? (
                    <div>
                      {/* Header */}
                      <div className="grid grid-cols-9 gap-4 py-2 px-4 bg-gray-100 rounded-t-lg text-sm font-medium text-gray-600">
                        <div className="col-span-2">Exercise</div>
                        <div className="col-span-1 text-center">Set</div>
                        <div className="col-span-1 text-center">Reps</div>
                        <div className="col-span-1 text-center">Weight</div>
                        <div className="col-span-1 text-center">RPE</div>
                        <div className="col-span-1 text-center">Rest</div>
                        <div className="col-span-2 text-right">Actions</div>
                      </div>

                      {routine.exercises.map((exercise, exerciseIndex) => (
                        <div key={exerciseIndex} className="border-b border-gray-200">
                          {/* Exercise Name and Notes - displayed once per exercise, outside the set loop */}
                          <div className="py-3 px-4">
                            <div className="font-medium text-gray-900">{exercise.name}</div>
                            {exercise.notes && <div className="text-sm text-gray-500 mt-1">{exercise.notes}</div>}
                          </div>

                          {/* Exercise sets */}
                          {programState.weeks[currentWeek - 1]?.routines[routineIndex]?.exercises[
                            exerciseIndex
                          ]?.sets?.map((set, setIndex) => (
                            <div
                              key={setIndex}
                              className="grid grid-cols-9 gap-4 py-3 px-4 items-center hover:bg-gray-50"
                            >
                              {/* Empty div to maintain col-span-2 alignment for the first column */}
                              <div className="col-span-2"></div>

                              <div className="col-span-1 flex justify-center">
                                <div className="bg-white border border-gray-300 rounded-xl w-8 h-8 flex items-center justify-center text-center font-medium text-gray-800 text-sm">
                                  {set.set_number}
                                </div>
                              </div>

                              <div className="col-span-1">
                                <Input
                                  value={set.reps || ""}
                                  onChange={(e) =>
                                    updateSetField(routineIndex, exerciseIndex, setIndex, "reps", e.target.value)
                                  }
                                  className="text-center h-8 text-sm border-transparent focus:border-gray-300"
                                  placeholder="10"
                                />
                              </div>

                              <div className="col-span-1">
                                <Input
                                  value={set.weight || ""}
                                  onChange={(e) =>
                                    updateSetField(routineIndex, exerciseIndex, setIndex, "weight", e.target.value)
                                  }
                                  className="text-center h-8 text-sm border-transparent focus:border-gray-300"
                                  placeholder="kg"
                                />
                              </div>

                              <div className="col-span-1">
                                <Input
                                  value={set.rpe || ""}
                                  onChange={(e) =>
                                    updateSetField(routineIndex, exerciseIndex, setIndex, "rpe", e.target.value)
                                  }
                                  className="text-center h-8 text-sm border-transparent focus:border-gray-300"
                                  placeholder="7"
                                />
                              </div>

                              <div className="col-span-1">
                                <Input
                                  value={set.rest || ""}
                                  onChange={(e) =>
                                    updateSetField(routineIndex, exerciseIndex, setIndex, "rest", e.target.value)
                                  }
                                  className="text-center h-8 text-sm border-transparent focus:border-gray-300"
                                  placeholder="60s"
                                />
                              </div>

                              <div className="col-span-2 flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => duplicateSet(routineIndex, exerciseIndex, setIndex)}
                                >
                                  <Copy className="h-4 w-4 text-gray-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => deleteSet(routineIndex, exerciseIndex, setIndex)}
                                >
                                  <Trash2 className="h-4 w-4 text-gray-500" />
                                </Button>
                              </div>
                            </div>
                          ))}

                          {/* Add set button */}
                          <div className="grid grid-cols-9 gap-4 py-2 px-4">
                            <div className="col-span-7"></div>
                            <div className="col-span-2 flex justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => addSet(routineIndex, exerciseIndex)}
                              >
                                <Plus className="h-4 w-4 text-gray-400" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">No exercises found in this routine.</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
          <div className="text-gray-400 mb-2">
            <Calendar className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No routines found</h3>
          <p className="text-gray-500 mb-4">
            {programState.is_periodized
              ? `Week ${currentWeek} doesn't have any workout routines yet.`
              : `This program doesn't have any workout routines yet.`}
          </p>
          <Button variant="outline">+ Add Routine</Button>
        </div>
      )}

      {/* Client Selection Section */}
      {showClientSelection && (
        <Card className="mt-6 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Send to Client</h3>
                <p className="text-sm text-gray-500">
                  Choose a client to send "{programState?.program_title}" to their mobile app.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => toggleClientSelection()}>
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>

            {/* Client Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Select Client</label>
              {isLoadingClients ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                  <span className="ml-2 text-gray-500">Loading clients...</span>
                </div>
              ) : clients.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <User className="mx-auto h-8 w-8 mb-2" />
                  <p>No clients found.</p>
                  <Button variant="outline" className="mt-3 bg-transparent" onClick={() => fetchClientsDirectly()}>
                    Refresh Clients
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                  {clients.map((client) => (
                    <div
                      key={client.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedClient?.id === client.id
                          ? "border-lime-500 bg-lime-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedClient(client)}
                    >
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{client.name}</p>
                          {client.email && <p className="text-sm text-gray-500">{client.email}</p>}
                          <p className="text-xs text-gray-400">Status: {client.status}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Message to Client */}
            {selectedClient && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message to {selectedClient.name} (Optional)
                </label>
                <Textarea
                  value={messageToClient}
                  onChange={(e) => setMessageToClient(e.target.value)}
                  placeholder="Add a personal message about this program..."
                  className="w-full"
                  rows={3}
                />
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">What happens next:</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>• Program will be converted to mobile app format</li>
                    <li>• Client will receive a notification</li>
                    <li>• Program will appear in their mobile app</li>
                    <li>• All exercises will be created if they don't exist</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Send Button */}
            {selectedClient && (
              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={handleSendToClient}
                  disabled={isSendingProgram}
                  className="bg-lime-400 hover:bg-lime-500 text-gray-800"
                >
                  {isSendingProgram ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-800 mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Program to {selectedClient.name}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Confirmation Dialog for Unsaved Changes */}
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

      {/* Select Week Dialog for switching from Periodized to Non-Periodized */}
      <Dialog open={showSelectWeekDialog} onOpenChange={setShowSelectWeekDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Week to Keep</DialogTitle>
            <DialogDescription>
              You are switching from a periodized program to a non-periodized program. Please select which week's data
              you would like to keep as the single routine for this program.
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
    </div>
  )
}
