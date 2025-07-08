"use client"

import type React from "react"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Send, User, Calendar, Clock, Dumbbell, Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface ExerciseSet {
  reps: string
  weight: string
  notes: string
}

interface Exercise {
  name: string
  sets: ExerciseSet[]
}

interface Routine {
  name: string
  exercises: Exercise[]
}

interface ProgramData {
  name: string
  program_title?: string
  duration_weeks: number
  routines: Routine[]
}

interface Exercise {
  name: string
  sets?: Array<{
    reps?: string
    weight?: string
    rpe?: string
    rest?: string
    notes?: string
    set_number?: number
  }>
  notes?: string
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
  title?: string
  description?: string
  duration_weeks?: number
  program_weeks?: number // Keep for backward compatibility
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

interface ReviewProgramClientProps {
  importData: any
  importId?: string
  initialClients?: Client[]
  programData: ProgramData
  clients: Client[]
}

interface AvailableFields {
  hasReps: boolean
  hasWeight: boolean
  hasRpe: boolean
  hasRest: boolean
  hasNotes: boolean
}

const debugLog = (message: string, data?: any) => {
  console.log(`[ReviewProgramClient] ${message}`, data || "")
}

const errorLog = (message: string, error?: any) => {
  console.error(`[ReviewProgramClient ERROR] ${message}`, error || "")
}

export default function ReviewProgramClient({
  importData,
  importId,
  initialClients = [],
  programData,
  clients,
}: ReviewProgramClientProps) {
  debugLog("Component initialized with props:", {
    importData: !!importData,
    importId,
    clientCount: initialClients.length,
  })

  const router = useRouter()
  const { toast } = useToast()
  const [programState, setProgramState] = useState<Program | null>(null)
  const [originalProgramState, setOriginalProgramState] = useState<Program | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientsState, setClientsState] = useState<Client[]>(initialClients)
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [customMessage, setCustomMessage] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isSending, setIsSending] = useState(isSaving)
  const [expandedRoutines, setExpandedRoutines] = useState<{ [key: number]: boolean }>({ 0: true })
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showPeriodizationDialog, setShowPeriodizationDialog] = useState(false)
  const [periodizationAction, setPeriodizationAction] = useState<"to-periodized" | "to-non-periodized" | null>(null)
  const [selectedWeekToKeep, setSelectedWeekToKeep] = useState<number>(1)
  const [numberOfWeeks, setNumberOfWeeks] = useState<number>(4)
  const [currentWeekIndex, setCurrentWeekIndex] = useState<number>(0)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleSendToClient = async () => {
    if (!selectedClientId) {
      toast({
        title: "Error",
        description: "Please select a client first",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      console.log("🔄 Sending program to client:", selectedClientId)
      console.log("📋 Program data:", programData)

      const response = await fetch("/api/programs/send-to-client", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: selectedClientId,
          programData,
          customMessage,
        }),
      })

      const result = await response.json()
      console.log("📨 API Response:", result)

      if (result.success) {
        toast({
          title: "Success!",
          description: result.message || "Program sent to client successfully",
        })
        setIsDialogOpen(false)
        setSelectedClientId("")
        setCustomMessage("")
      } else {
        throw new Error(result.error || "Failed to send program")
      }
    } catch (error) {
      console.error("❌ Error sending program:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send program to client",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const goToNextWeek = useCallback(() => {
    if (programState?.weeks && currentWeekIndex < programState.weeks.length - 1) {
      setCurrentWeekIndex(currentWeekIndex + 1)
    }
  }, [currentWeekIndex, programState?.weeks])

  const goToPreviousWeek = useCallback(() => {
    if (currentWeekIndex > 0) {
      setCurrentWeekIndex(currentWeekIndex - 1)
    }
  }, [currentWeekIndex])

  const goToWeek = useCallback((weekIndex: number) => {
    setCurrentWeekIndex(weekIndex)
  }, [])

  // FIXED: Get current routines with fallback logic
  const currentRoutines = useMemo(() => {
    if (!programState) return []

    const displayAllWeeks = programState.is_periodized && programState.weeks && programState.weeks.length > 0

    if (displayAllWeeks) {
      return [] // Will show weeks view instead
    }

    // For non-periodized, check routines array first
    let routines = programState.routines || []

    // CRITICAL FIX: If routines array is empty but we have weeks, use weeks[0].routines
    if (routines.length === 0 && programState.weeks && programState.weeks.length > 0) {
      routines = programState.weeks[0]?.routines || []
      debugLog("Using fallback routines from weeks[0]:", routines.length)
    }

    return routines
  }, [programState])

  // Analyze available fields in the program data
  const availableFields = useMemo((): AvailableFields => {
    debugLog("Computing available fields for program state:", programState)

    if (!programState) {
      debugLog("No program state, returning default fields")
      return {
        hasReps: false,
        hasWeight: false,
        hasRpe: false,
        hasRest: false,
        hasNotes: false,
      }
    }

    // FIXED: Use currentRoutines which handles the fallback logic
    const routinesToCheck =
      currentRoutines.length > 0
        ? currentRoutines
        : programState.weeks && programState.weeks.length > 0
          ? programState.weeks[0].routines
          : []

    debugLog("Routines for field analysis:", routinesToCheck)

    let hasReps = false
    let hasWeight = false
    let hasRpe = false
    let hasRest = false
    let hasNotes = false

    try {
      for (const routine of routinesToCheck) {
        if (routine && routine.exercises) {
          for (const exercise of routine.exercises) {
            if (exercise && exercise.sets) {
              for (const set of exercise.sets) {
                if (set) {
                  if (set.reps !== undefined && set.reps !== null && set.reps !== "") hasReps = true
                  if (set.weight !== undefined && set.weight !== null && set.weight !== "") hasWeight = true
                  if (set.rpe !== undefined && set.rpe !== null && set.rpe !== "") hasRpe = true
                  if (set.rest !== undefined && set.rest !== null && set.rest !== "") hasRest = true
                  if (set.notes !== undefined && set.notes !== null && set.notes !== "") hasNotes = true
                }
              }
            }
          }
        }
      }
    } catch (err) {
      errorLog("Error analyzing available fields:", err)
    }

    const fields = { hasReps, hasWeight, hasRpe, hasRest, hasNotes }
    debugLog("Computed available fields:", fields)
    return fields
  }, [programState, currentRoutines])

  // Initialize program state from import data
  useEffect(() => {
    const initializeProgram = () => {
      debugLog("Initializing program from import data")

      try {
        setIsLoading(true)
        setError(null)

        if (!importData) {
          errorLog("No import data provided")
          setError("No import data provided")
          setIsLoading(false)
          return
        }

        debugLog("Import data structure:", importData)

        if (!importData.program) {
          errorLog("No program data found in import")
          setError("No program data found in import")
          setIsLoading(false)
          return
        }

        const program = importData.program
        debugLog("Program data from import:", program)

        const programState: Program = {
          name: importData.name || program.program_title || program.title || program.name || "Untitled Program",
          program_title: program.program_title || program.title || program.name,
          description: program.description || "",
          duration_weeks: Number(program.duration_weeks || program.program_weeks || program.weeks?.length || 1),
          is_periodized: Boolean(program.is_periodized || (program.weeks && program.weeks.length > 1)),
          weeks: program.weeks || [],
          routines: program.routines || [],
          notes: program.notes || "",
        }

        debugLog("Created program state:", programState)
        setProgramState(programState)
        setOriginalProgramState(JSON.parse(JSON.stringify(programState))) // Deep copy for comparison
        setIsLoading(false)
      } catch (err) {
        errorLog("Error initializing program state:", err)
        setError("Failed to load program data")
        setIsLoading(false)
      }
    }

    initializeProgram()
  }, [importData])

  // Fetch clients if not provided initially
  useEffect(() => {
    const fetchClients = async () => {
      debugLog("Fetching clients, initial count:", initialClients.length)

      if (initialClients.length === 0) {
        try {
          const response = await fetch("/api/clients", {
            credentials: "include",
          })

          if (response.ok) {
            const data = await response.json()
            debugLog("Fetched clients from API:", data.clients)
            setClientsState(data.clients || [])
          } else {
            debugLog("Failed to fetch clients, status:", response.status)
          }
        } catch (error) {
          errorLog("Error fetching clients:", error)
        }
      } else {
        setClientsState(initialClients)
      }
    }

    fetchClients()
  }, [initialClients])

  const handleSaveChanges = useCallback(async () => {
    debugLog("Saving changes for program:", programState?.name)

    if (!programState || !importId) {
      debugLog("Cannot save - missing program state or import ID")
      return
    }

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
          status: "reviewed",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save changes")
      }

      debugLog("Changes saved successfully")
      toast({
        title: "Changes Saved",
        description: "Your program changes have been saved successfully.",
      })
      setHasChanges(false)
      setOriginalProgramState(JSON.parse(JSON.stringify(programState))) // Update original state
    } catch (error) {
      errorLog("Error saving changes:", error)
      toast({
        title: "Save Failed",
        description: "Failed to save your changes. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [programState, importId, toast])

  const handleCancelChanges = useCallback(() => {
    debugLog("Canceling changes, reverting to original state")

    if (originalProgramState) {
      setProgramState(JSON.parse(JSON.stringify(originalProgramState))) // Deep copy to avoid reference issues
      setHasChanges(false)
      setExpandedRoutines({ 0: true }) // Reset expanded state
      setCurrentWeekIndex(0) // Reset week index

      toast({
        title: "Changes Canceled",
        description: "All changes have been discarded and reverted to the original state.",
      })
    }
  }, [originalProgramState, toast])

  const createSafeClickHandler = useCallback((handler: () => void, handlerName: string) => {
    return (event?: React.MouseEvent) => {
      try {
        if (event) {
          event.preventDefault()
          event.stopPropagation()
        }
        debugLog(`Executing safe click handler: ${handlerName}`)
        handler()
      } catch (err) {
        errorLog(`Error in ${handlerName}:`, err)
      }
    }
  }, [])

  const selectedClient = clients.find((client) => client.id === selectedClientId)

  const handleTogglePeriodization = useCallback(
    (checked: boolean) => {
      debugLog("Toggle periodization called with checked:", checked)
      debugLog("Current program state:", programState)

      if (!programState) {
        errorLog("Cannot toggle periodization - no program state")
        return
      }

      try {
        if (checked && !programState.is_periodized) {
          debugLog("Converting to periodized")
          setPeriodizationAction("to-periodized")
          // Use current duration_weeks for the conversion
          setNumberOfWeeks(programState.duration_weeks || 4)
          setShowPeriodizationDialog(true)
        } else if (!checked && programState.is_periodized) {
          debugLog("Converting to non-periodized")
          setPeriodizationAction("to-non-periodized")
          setSelectedWeekToKeep(1)
          setShowPeriodizationDialog(true)
        } else {
          debugLog("No action needed for periodization toggle")
        }
      } catch (err) {
        errorLog("Error in handleTogglePeriodization:", err)
      }
    },
    [programState, setPeriodizationAction, setShowPeriodizationDialog],
  )

  const confirmPeriodizationChange = useCallback(() => {
    debugLog("Confirming periodization change:", periodizationAction)
    debugLog("Program state before conversion:", programState)

    if (!programState || !periodizationAction) {
      errorLog("Cannot confirm periodization change - missing state or action")
      return
    }

    try {
      if (periodizationAction === "to-periodized") {
        debugLog("Converting to periodized with weeks:", numberOfWeeks)

        // FIXED: Get base routines with proper fallback logic
        let baseRoutines: Routine[] = programState.routines || []

        // CRITICAL FIX: If routines array is empty, check weeks[0].routines
        if (baseRoutines.length === 0 && programState.weeks && programState.weeks.length > 0) {
          baseRoutines = programState.weeks[0]?.routines || []
          debugLog("Using fallback routines from weeks[0] for conversion:", baseRoutines.length)
        }

        debugLog("Base routines for conversion:", baseRoutines)

        if (baseRoutines.length === 0) {
          debugLog("No routines found for conversion")
          toast({
            title: "No Routines Found",
            description: "Cannot convert to periodized - no routines found in the program.",
            variant: "destructive",
          })
          setShowPeriodizationDialog(false)
          setPeriodizationAction(null)
          return
        }

        const weeks: Week[] = []

        for (let weekNum = 1; weekNum <= numberOfWeeks; weekNum++) {
          weeks.push({
            week_number: weekNum,
            routines: baseRoutines.map((routine, index) => ({
              ...routine,
              name: `${routine.name || routine.title || `Routine ${index + 1}`} - Week ${weekNum}`,
            })),
          })
        }

        debugLog("Created weeks for periodized program:", weeks)

        setProgramState((prev) => {
          if (!prev) {
            debugLog("Previous state is null, cannot update")
            return prev
          }
          const newState = {
            ...prev,
            is_periodized: true,
            weeks,
            routines: undefined,
            duration_weeks: numberOfWeeks, // Keep the selected duration
          }
          debugLog("New program state after conversion to periodized:", newState)
          return newState
        })

        toast({
          title: "Converted to Periodized",
          description: `Program converted to ${numberOfWeeks} weeks using ${baseRoutines.length} base routines`,
        })
      } else if (periodizationAction === "to-non-periodized") {
        debugLog("Converting to non-periodized, keeping week:", selectedWeekToKeep)

        const selectedWeek = programState.weeks?.find((w) => w.week_number === selectedWeekToKeep)
        const routinesToKeep = selectedWeek?.routines || []

        debugLog("Selected week data:", selectedWeek)
        debugLog("Routines to keep:", routinesToKeep)

        if (routinesToKeep.length === 0) {
          debugLog("No routines found in selected week")
          toast({
            title: "No Routines Found",
            description: `No routines found in week ${selectedWeekToKeep}. Please select a different week.`,
            variant: "destructive",
          })
          return
        }

        // Remove week suffixes from routine names
        const cleanedRoutines = routinesToKeep.map((routine) => ({
          ...routine,
          name: routine.name?.replace(/ - Week \d+$/, "") || routine.name,
        }))

        debugLog("Cleaned routines:", cleanedRoutines)

        setProgramState((prev) => {
          if (!prev) {
            debugLog("Previous state is null, cannot update")
            return prev
          }
          const newState = {
            ...prev,
            is_periodized: false,
            routines: cleanedRoutines,
            weeks: undefined,
            // FIXED: Keep the original duration_weeks, don't change it to 1
            duration_weeks: prev.duration_weeks, // Preserve original duration
          }
          debugLog("New program state after conversion to non-periodized:", newState)
          return newState
        })

        toast({
          title: "Converted to Non-Periodized",
          description: `Program converted using routines from Week ${selectedWeekToKeep}. Duration remains ${programState.duration_weeks} weeks.`,
        })
      }

      setHasChanges(true)
      setShowPeriodizationDialog(false)
      setPeriodizationAction(null)
      setExpandedRoutines({ 0: true })

      debugLog("Periodization conversion completed successfully")
    } catch (error) {
      errorLog("Error in periodization conversion:", error)
      toast({
        title: "Conversion Failed",
        description: "An error occurred during the conversion. Please try again.",
        variant: "destructive",
      })
      setShowPeriodizationDialog(false)
      setPeriodizationAction(null)
    }
  }, [programState, periodizationAction, numberOfWeeks, selectedWeekToKeep, toast])

  const updateProgramField = useCallback(
    (field: keyof Program, value: any) => {
      debugLog("Updating program field:", field, "with value:", value)

      if (!programState) {
        debugLog("Cannot update field - no program state")
        return
      }

      setProgramState((prev) => {
        if (!prev) return prev
        const newState = {
          ...prev,
          [field]: value,
        }
        debugLog("Updated program state:", newState)
        return newState
      })
      setHasChanges(true) // This should trigger the Save Changes button to appear
    },
    [programState],
  )

  const toggleRoutineExpansion = useCallback((index: number) => {
    debugLog("Toggling routine expansion for index:", index)

    setExpandedRoutines((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }, [])

  const updateSetField = useCallback(
    (routineIndex: number, exerciseIndex: number, setIndex: number, field: string, value: any) => {
      debugLog("Updating set field:", { routineIndex, exerciseIndex, setIndex, field, value })

      setProgramState((prev) => {
        if (!prev) {
          debugLog("Cannot update set field - no program state")
          return prev
        }

        const newState = { ...prev }

        // Handle both periodized (weeks) and non-periodized structures
        let targetRoutines: Routine[] = []

        if (newState.is_periodized && newState.weeks && newState.weeks.length > 0) {
          // For periodized programs, update the current week being viewed
          const currentWeek = newState.weeks[currentWeekIndex]
          if (currentWeek && currentWeek.routines) {
            targetRoutines = currentWeek.routines
            debugLog("Using periodized routines from current week:", currentWeekIndex)
          }
        } else if (newState.routines && newState.routines.length > 0) {
          // For non-periodized programs, use the routines array
          targetRoutines = newState.routines
          debugLog("Using non-periodized routines")
        } else if (newState.weeks && newState.weeks.length > 0 && newState.weeks[0].routines) {
          // Fallback: use first week's routines if routines array is empty
          targetRoutines = newState.weeks[0].routines
          debugLog("Using fallback routines from first week")
        }

        debugLog("Target routines for update:", targetRoutines.length)

        if (targetRoutines[routineIndex]?.exercises[exerciseIndex]?.sets?.[setIndex]) {
          const currentSet = targetRoutines[routineIndex].exercises[exerciseIndex].sets![setIndex]
          targetRoutines[routineIndex].exercises[exerciseIndex].sets![setIndex] = {
            ...currentSet,
            [field]: value,
          }
          debugLog("Updated set successfully")
        } else {
          debugLog("Could not find target set for update")
        }

        return newState
      })
      setHasChanges(true)
    },
    [currentWeekIndex], // Add currentWeekIndex as dependency
  )

  const addSet = useCallback(
    (routineIndex: number, exerciseIndex: number) => {
      debugLog("Adding set to routine:", routineIndex, "exercise:", exerciseIndex)

      setProgramState((prev) => {
        if (!prev) return prev

        const newState = { ...prev }

        let targetRoutines: Routine[] = []

        if (newState.is_periodized && newState.weeks && newState.weeks.length > 0) {
          const currentWeek = newState.weeks[currentWeekIndex]
          if (currentWeek && currentWeek.routines) {
            targetRoutines = currentWeek.routines
          }
        } else if (newState.routines && newState.routines.length > 0) {
          targetRoutines = newState.routines
        } else if (newState.weeks && newState.weeks.length > 0 && newState.weeks[0].routines) {
          targetRoutines = newState.weeks[0].routines
        }

        if (targetRoutines[routineIndex]?.exercises[exerciseIndex]) {
          const exercise = targetRoutines[routineIndex].exercises[exerciseIndex]
          if (!exercise.sets) exercise.sets = []

          exercise.sets.push({
            reps: "",
            weight: "",
            rpe: "",
            rest: "",
            notes: "",
            set_number: exercise.sets.length + 1,
          })

          debugLog("Added new set, total sets now:", exercise.sets.length)
        }

        return newState
      })
      setHasChanges(true)
    },
    [currentWeekIndex],
  )

  const removeSet = useCallback(
    (routineIndex: number, exerciseIndex: number, setIndex: number) => {
      debugLog("Removing set from routine:", routineIndex, "exercise:", exerciseIndex, "set:", setIndex)

      setProgramState((prev) => {
        if (!prev) return prev

        const newState = { ...prev }

        let targetRoutines: Routine[] = []

        if (newState.is_periodized && newState.weeks && newState.weeks.length > 0) {
          const currentWeek = newState.weeks[currentWeekIndex]
          if (currentWeek && currentWeek.routines) {
            targetRoutines = currentWeek.routines
          }
        } else if (newState.routines && newState.routines.length > 0) {
          targetRoutines = newState.routines
        } else if (newState.weeks && newState.weeks.length > 0 && newState.weeks[0].routines) {
          targetRoutines = newState.weeks[0].routines
        }

        if (targetRoutines[routineIndex]?.exercises[exerciseIndex]?.sets) {
          targetRoutines[routineIndex].exercises[exerciseIndex].sets!.splice(setIndex, 1)
          debugLog("Removed set successfully")
        }

        return newState
      })
      setHasChanges(true)
    },
    [currentWeekIndex],
  )

  const duplicateSet = useCallback(
    (routineIndex: number, exerciseIndex: number, setIndex: number) => {
      debugLog("Duplicating set from routine:", routineIndex, "exercise:", exerciseIndex, "set:", setIndex)

      setProgramState((prev) => {
        if (!prev) return prev

        const newState = { ...prev }

        let targetRoutines: Routine[] = []

        if (newState.is_periodized && newState.weeks && newState.weeks.length > 0) {
          const currentWeek = newState.weeks[currentWeekIndex]
          if (currentWeek && currentWeek.routines) {
            targetRoutines = currentWeek.routines
          }
        } else if (newState.routines && newState.routines.length > 0) {
          targetRoutines = newState.routines
        } else if (newState.weeks && newState.weeks.length > 0 && newState.weeks[0].routines) {
          targetRoutines = newState.weeks[0].routines
        }

        if (targetRoutines[routineIndex]?.exercises[exerciseIndex]?.sets?.[setIndex]) {
          const originalSet = targetRoutines[routineIndex].exercises[exerciseIndex].sets![setIndex]
          const duplicatedSet = { ...originalSet }
          targetRoutines[routineIndex].exercises[exerciseIndex].sets!.splice(setIndex + 1, 0, duplicatedSet)
          debugLog("Duplicated set successfully")
        }

        return newState
      })
      setHasChanges(true)
    },
    [currentWeekIndex],
  )

  const handleBackClick = () => {
    debugLog("Back button clicked, has changes:", hasChanges)

    if (hasChanges) {
      setShowConfirmDialog(true)
    } else {
      router.back()
    }
  }

  const confirmLeave = () => {
    debugLog("Confirmed leaving without saving")
    setShowConfirmDialog(false)
    router.back()
  }

  // Add this useEffect to debug hasChanges state
  useEffect(() => {
    debugLog("hasChanges state changed:", hasChanges)
  }, [hasChanges])

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading program data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Program</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={createSafeClickHandler(() => router.back(), "router.back")} variant="outline">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!programState) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">No Program Data</h2>
            <p className="text-yellow-600 mb-4">No program data was found to review.</p>
            <Button onClick={createSafeClickHandler(() => router.back(), "router.back")} variant="outline">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const displayAllWeeks = programState.is_periodized && programState.weeks && programState.weeks.length > 0

  debugLog("Rendering component with:", {
    displayAllWeeks,
    currentRoutinesLength: currentRoutines.length,
    weeksLength: programState.weeks?.length || 0,
    isPeriodized: programState.is_periodized,
  })

  return (
    <div className="space-y-6">
      {/* Program Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            {programData.name || programData.program_title || "Untitled Program"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {programData.duration_weeks} weeks
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {programData.routines.length} routines
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Routines Preview */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Program Routines</h3>
        <div className="grid gap-4">
          {programData.routines.map((routine, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{routine.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {routine.exercises.map((exercise, exerciseIndex) => (
                    <div key={exerciseIndex} className="flex items-center justify-between">
                      <span className="font-medium">{exercise.name}</span>
                      <Badge variant="secondary">
                        {exercise.sets.length} set{exercise.sets.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Send to Client Section */}
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Send className="h-4 w-4 mr-2" />
              Send to Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Send Program to Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Client</label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{client.name}</span>
                          <span className="text-muted-foreground">({client.email})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Custom Message (Optional)</label>
                <Textarea
                  placeholder="Add a personal message for your client..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={3}
                />
              </div>

              {selectedClient && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>Sending to:</strong> {selectedClient.name} ({selectedClient.email})
                  </p>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSendToClient}
                  disabled={isLoading || !selectedClientId}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
