"use client"

import type React from "react"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ChevronDown, ChevronUp, Copy, Trash2, Plus, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { CardioToggle } from "@/components/programs/cardio-toggle"
import { MuscleGroupSelector } from "@/components/programs/muscle-group-selector"
import { ProgramExercise } from "@/types/workout-program"

interface Routine {
  name?: string
  title?: string
  exercises: ProgramExercise[]
}

interface Week {
  week_number: number
  routines: Routine[]
}

interface Program {
  id: string
  name?: string
  title?: string
  start_date?: string
  description?: string
  duration_weeks?: number
  program_weeks?: number // Keep for backward compatibility
  is_periodized?: boolean
  weeks?: Week[]
  routines?: Routine[]
  notes?: string
}

// Editable Exercise Field Component
function EditableExerciseField({
  exercise,
  routineIndex,
  exerciseIndex,
  field,
  onFieldUpdate,
}: {
  exercise: ProgramExercise
  routineIndex: number
  exerciseIndex: number
  field: string
  onFieldUpdate: (routineIndex: number, exerciseIndex: number, field: string, value: any) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const displayValue = (exercise[field as keyof ProgramExercise] as string) || (field === "name" ? "Untitled Exercise" : "")

  const handleClick = () => {
    console.log("[EditableExerciseField] Double click on:", { routineIndex, exerciseIndex, field })
    setIsEditing(true)
    setEditValue(displayValue)
  }

  const handleSave = async () => {
    if (isSaving) return

    const trimmedValue = editValue.trim()
    console.log("[EditableExerciseField] Saving field:", {
      routineIndex,
      exerciseIndex,
      field,
      oldValue: displayValue,
      newValue: trimmedValue
    })

    // If no change, just exit edit mode
    if (trimmedValue === displayValue) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)

    try {
      // Update the exercise field
      onFieldUpdate(routineIndex, exerciseIndex, field, trimmedValue)
      setIsEditing(false)
    } catch (error) {
      console.error("[EditableExerciseField] Save failed:", error)
      alert(`Failed to update exercise ${field}. Please try again.`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      setIsEditing(false)
      setEditValue(displayValue === (field === "name" ? "Untitled Exercise" : "") ? "" : displayValue)
    }
  }

  if (isEditing) {
    return (
      <Input
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="text-[14px] font-medium text-black font-sen h-6 px-1 py-0 border-0 bg-white focus:ring-1 focus:ring-blue-500 rounded"
        placeholder={`Enter exercise ${field}...`}
        autoFocus
        disabled={isSaving}
      />
    )
  }

  return (
    field === "name" ? (
      <h4
        className="font-medium mb-3 cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded transition-colors text-left"
        onClick={handleClick}
        title="Click to edit"
      >
        {displayValue}
      </h4>
    ) : (
      <p
        className="text-sm text-gray-600 mb-3 cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded transition-colors"
        onClick={handleClick}
        title="Click to edit"
      >
        {displayValue}
      </p>
    )
  )
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

export default function ReviewProgramClient({ importData, importId }: ReviewProgramClientProps) {
  debugLog("Component initialized with props:", {
    importData: !!importData,
    importId,
  })

  const router = useRouter()
  const { toast } = useToast()
  const [programState, setProgramState] = useState<Program | null>(null)
  const [originalProgramState, setOriginalProgramState] = useState<Program | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [customMessage, setCustomMessage] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isSending, setIsSending] = useState(isSaving)
  const [expandedRoutines, setExpandedRoutines] = useState<{ [key: number]: boolean }>({ 0: true })
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [showSendSuccess, setShowSendSuccess] = useState<boolean>(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showPeriodizationDialog, setShowPeriodizationDialog] = useState(false)
  const [periodizationAction, setPeriodizationAction] = useState<"to-periodized" | "to-non-periodized" | null>(null)
  const [selectedWeekToKeep, setSelectedWeekToKeep] = useState<number>(1)
  const [numberOfWeeks, setNumberOfWeeks] = useState<number>(4)
  const [currentWeekIndex, setCurrentWeekIndex] = useState<number>(0)

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
          id: importData.id ?? importId,
          name: importData.name || program.name || "Untitled Program",
          start_date: program.start_date || new Date().toISOString(),
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
      try {
        const response = await fetch("/api/clients", {
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          debugLog("Fetched clients from API:", data.clients)
          setClients(data.clients || [])
        } else {
          debugLog("Failed to fetch clients, status:", response.status)
        }
      } catch (error) {
        errorLog("Error fetching clients:", error)
      }
    }

    fetchClients()
  }, [])

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
          name: programState.name,
          status: "reviewed",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save changes")
      }

      debugLog("Changes saved successfully")
      toast.success({
        title: "Changes Saved",
        description: "Your program changes have been saved successfully.",
      })
      setHasChanges(false)
      setOriginalProgramState(JSON.parse(JSON.stringify(programState))) // Update original state
    } catch (error) {
      errorLog("Error saving changes:", error)
      toast.error({
        title: "Save Failed",
        description: "Failed to save your changes. Please try again.",
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

      toast.default({
        title: "Changes Canceled",
        description: "All changes have been discarded and reverted to the original state.",
      })
    }
  }, [originalProgramState, toast])

  const handleSendToClient = useCallback(async () => {
    debugLog("Sending program to client:", selectedClientId)

    if (!selectedClientId || !programState) {
      debugLog("Cannot send - missing client ID or program state")
      toast.error({
        title: "Missing Information",
        description: "Please select a client and ensure program data is loaded.",
      })
      return
    }

    const selectedClient = clients.find((c) => c.id === selectedClientId)
    if (!selectedClient) {
      debugLog("Selected client not found in clients list")
      toast.error({
        title: "Client Not Found",
        description: "The selected client could not be found.",
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
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || "Failed to send program")
      }

      const result = await response.json()
      debugLog("Program sent successfully:", result)

      setShowSendSuccess(true)
      setSelectedClientId("")
      setCustomMessage("")
      setShowSendDialog(false)
    } catch (error) {
      errorLog("Error sending program:", error)
      toast.error({
        title: "Failed to Send Program",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      })
    } finally {
      setIsSending(false)
    }
  }, [selectedClientId, programState, clients, customMessage, toast])

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
          toast.error({
            title: "No Routines Found",
            description: "Cannot convert to periodized - no routines found in the program.",
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

        toast.success({
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
          toast.error({
            title: "No Routines Found",
            description: `No routines found in week ${selectedWeekToKeep}. Please select a different week.`,
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

        toast.success({
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
      toast.error({
        title: "Conversion Failed",
        description: "An error occurred during the conversion. Please try again.",
      })
      setShowPeriodizationDialog(false)
      setPeriodizationAction(null)
    }
  }, [programState, periodizationAction, numberOfWeeks, selectedWeekToKeep, toast])

  const updateProgramField = useCallback(
    (field: keyof Program, value: any) => {

      if (!programState) {
        debugLog("Cannot update field - no program state")
        return
      }

      setProgramState((prev) => {
        if (!prev) return prev

        // Special handling for duration_weeks changes in periodized programs
        if (field === "duration_weeks" && prev.is_periodized && prev.weeks && prev.weeks.length > 0) {
          const newDuration = value as number
          const currentDuration = prev.weeks.length

          debugLog("Duration changed for periodized program:", { currentDuration, newDuration })

          if (newDuration > currentDuration) {
            // Add more weeks by duplicating the last week's routines
            const newWeeks = [...prev.weeks]
            const lastWeek = prev.weeks[currentDuration - 1]

            for (let weekNum = currentDuration + 1; weekNum <= newDuration; weekNum++) {
              newWeeks.push({
                week_number: weekNum,
                routines: lastWeek.routines.map((routine, index) => ({
                  ...routine,
                  name: `${routine.name?.replace(/ - Week \d+$/, "") || routine.title || `Routine ${index + 1}`} - Week ${weekNum}`,
                })),
              })
            }

            debugLog("Added weeks to periodized program:", newWeeks.length)

            return {
              ...prev,
              [field]: value,
              weeks: newWeeks,
            }
          } else if (newDuration < currentDuration) {
            // Remove excess weeks
            const newWeeks = prev.weeks.slice(0, newDuration)

            debugLog("Removed weeks from periodized program:", newWeeks.length)

            return {
              ...prev,
              [field]: value,
              weeks: newWeeks,
            }
          }
        }

        // Default field update
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

  const updateExerciseField = useCallback(
    (routineIndex: number, exerciseIndex: number, field: string, value: any) => {
      debugLog("Updating exercise field:", { routineIndex, exerciseIndex, field, value })

      setProgramState((prev) => {
        if (!prev) {
          debugLog("Cannot update exercise field - no program state")
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

        debugLog("Target routines for exercise field update:", targetRoutines.length)

        if (targetRoutines[routineIndex]?.exercises[exerciseIndex]) {
          targetRoutines[routineIndex].exercises[exerciseIndex] = {
            ...targetRoutines[routineIndex].exercises[exerciseIndex],
            [field]: value,
          }

          debugLog("Updated exercise field:", {
            routineIndex,
            exerciseIndex,
            field,
            value,
            updatedExercise: targetRoutines[routineIndex].exercises[exerciseIndex],
          })

          setHasChanges(true)
        } else {
          debugLog("Cannot find target exercise for field update:", {
            routineIndex,
            exerciseIndex,
            hasRoutines: targetRoutines.length > 0,
            hasExercises: targetRoutines[routineIndex]?.exercises?.length,
          })
        }

        return newState
      })
    },
    [currentWeekIndex],
  )

  const duplicateExercise = useCallback(
    (routineIndex: number, exerciseIndex: number) => {
      debugLog("Duplicating exercise:", { routineIndex, exerciseIndex })

      setProgramState((prev) => {
        if (!prev) {
          debugLog("Cannot duplicate exercise - no program state")
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

        debugLog("Target routines for exercise duplication:", targetRoutines.length)

        if (targetRoutines[routineIndex]?.exercises[exerciseIndex]) {
          const originalExercise = targetRoutines[routineIndex].exercises[exerciseIndex]

          // Create a deep copy of the exercise
          const duplicatedExercise = {
            ...originalExercise,
            name: `${originalExercise.name} (Copy)`,
            id: undefined,
            sets: originalExercise.sets ? [...originalExercise.sets] : undefined,
          } as ProgramExercise;

          // Insert the duplicated exercise after the original
          targetRoutines[routineIndex].exercises.splice(exerciseIndex + 1, 0, duplicatedExercise);

          debugLog("Duplicated exercise:", {
            routineIndex,
            exerciseIndex,
            originalName: originalExercise.name,
            duplicatedName: duplicatedExercise.name,
            totalExercises: targetRoutines[routineIndex].exercises.length,
          })

          setHasChanges(true)
        } else {
          debugLog("Cannot find target exercise for duplication:", {
            routineIndex,
            exerciseIndex,
            hasRoutines: targetRoutines.length > 0,
            hasExercises: targetRoutines[routineIndex]?.exercises?.length,
          })
        }

        return newState
      })
    },
    [currentWeekIndex],
  )

  const deleteExercise = useCallback(
    (routineIndex: number, exerciseIndex: number) => {
      debugLog("Deleting exercise:", { routineIndex, exerciseIndex })

      setProgramState((prev) => {
        if (!prev) {
          debugLog("Cannot delete exercise - no program state")
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

        debugLog("Target routines for exercise deletion:", targetRoutines.length)

        if (targetRoutines[routineIndex]?.exercises[exerciseIndex]) {
          const exerciseToDelete = targetRoutines[routineIndex].exercises[exerciseIndex]

          // Remove the exercise from the array
          targetRoutines[routineIndex].exercises.splice(exerciseIndex, 1)

          debugLog("Deleted exercise:", {
            routineIndex,
            exerciseIndex,
            deletedName: exerciseToDelete.name,
            remainingExercises: targetRoutines[routineIndex].exercises.length,
          })

          setHasChanges(true)
        } else {
          debugLog("Cannot find target exercise for deletion:", {
            routineIndex,
            exerciseIndex,
            hasRoutines: targetRoutines.length > 0,
            hasExercises: targetRoutines[routineIndex]?.exercises?.length,
          })
        }

        return newState
      })
    },
    [currentWeekIndex],
  )

  const addSet = useCallback(
    (routineIndex: number, exerciseIndex: number) => {

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
          });

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
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={createSafeClickHandler(handleBackClick, "handleBackClick")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Review Program</h1>
            <p className="text-gray-600">Review and edit your imported program before sending to clients</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={createSafeClickHandler(handleCancelChanges, "handleCancelChanges")}
            variant="outline"
            disabled={!hasChanges || isSaving}
          >
            Cancel Changes
          </Button>
          <Button
            onClick={createSafeClickHandler(handleSaveChanges, "handleSaveChanges")}
            disabled={!hasChanges || isSaving}
            variant="outline"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            onClick={createSafeClickHandler(() => setShowSendDialog(true), "setShowSendDialog")}
            disabled={!programState}
          >
            Send to Client
          </Button>
        </div>
      </div>

      {/* Program Details */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Program Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="program-name">Program Name</Label>
            <Input
              id="program-name"
              value={programState.name || ""}
              onChange={(e) => updateProgramField("name", e.target.value)}
              placeholder="Enter program name"
            />
          </div>
          <div>
            <Label htmlFor="duration">Duration (weeks)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="52"
              value={programState.duration_weeks || 1}
              onChange={(e) => {
                const newDuration = Number.parseInt(e.target.value) || 1
                updateProgramField("duration_weeks", newDuration)
              }}
            />
          </div>
          <div>
            <Label htmlFor="start-date">Start Date</Label>
            <div className="w-full">
              <DatePicker
                id="start-date"
                selected={programState.start_date ? new Date(programState.start_date) : null}
                onChange={(date) => {
                  updateProgramField("start_date", date ? date.toISOString().split('T')[0] : "")
                }}
                dateFormat="dd-MM-yyyy"
                placeholderText="Select start date"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                showPopperArrow={false}
                popperClassName="react-datepicker-popper"
              />
            </div>
          </div>
          <div className="md:col-span-3">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={programState.description || ""}
              onChange={(e) => updateProgramField("description", e.target.value)}
              placeholder="Enter program description"
              rows={3}
            />
          </div>
        </div>

        {/* Periodization Toggle */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="periodization-toggle" className="text-base font-medium">
                Periodization
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                {programState.is_periodized
                  ? `Different routines for each week over ${programState.duration_weeks} weeks (periodized)`
                  : `Same routines repeated each week for ${programState.duration_weeks} weeks (non-periodized)`}
              </p>
            </div>
            <Switch
              id="periodization-toggle"
              checked={programState.is_periodized || false}
              onCheckedChange={handleTogglePeriodization}
            />
          </div>
        </div>
      </Card>

      {/* Program Structure */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Program Structure</h2>
          <div className="flex gap-2">
            <Badge variant="outline">{programState.is_periodized ? "Periodized" : "Non-Periodized"}</Badge>
            {displayAllWeeks ? (
              <Badge variant="secondary">{programState.weeks?.length} Weeks</Badge>
            ) : (
              <Badge variant="secondary">{currentRoutines.length} Routines</Badge>
            )}
          </div>
        </div>

        {displayAllWeeks ? (
          // Show weeks carousel for periodized programs
          <div className="space-y-4">
            {/* Week Navigation Header */}
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={createSafeClickHandler(goToPreviousWeek, "goToPreviousWeek")}
                  disabled={currentWeekIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="text-center">
                  <h3 className="font-semibold text-lg">
                    Week {programState.weeks?.[currentWeekIndex]?.week_number || 1}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {currentWeekIndex + 1} of {programState.weeks?.length || 0}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={createSafeClickHandler(goToNextWeek, "goToNextWeek")}
                  disabled={currentWeekIndex === (programState.weeks?.length || 1) - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Week Dots Indicator */}
              <div className="flex gap-2">
                {programState.weeks?.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToWeek(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentWeekIndex ? "bg-blue-500" : "bg-gray-300 hover:bg-gray-400"
                    }`}
                    title={`Go to Week ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Current Week Content */}
            {programState.weeks?.[currentWeekIndex] && (
              <Card className="border-l-4 border-l-green-500">
                <div className="p-4">
                  <div className="space-y-4">
                    {programState.weeks[currentWeekIndex].routines?.map((routine, routineIndex) => (
                      <Card key={routineIndex} className="border-l-4 border-l-blue-500">
                        <div className="p-4">
                          <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={createSafeClickHandler(
                              () => toggleRoutineExpansion(routineIndex),
                              `toggleRoutineExpansion-${routineIndex}`,
                            )}
                          >
                            <div>
                              <h3 className="font-medium">
                                {routine.name || routine.title || `Routine ${routineIndex + 1}`}
                              </h3>
                              <p className="text-sm text-gray-600">{routine.exercises?.length || 0} exercises</p>
                            </div>
                            {expandedRoutines[routineIndex] ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>

                          {expandedRoutines[routineIndex] && (
                            <div className="mt-4 space-y-4">
                              {routine.exercises?.map((exercise, exerciseIndex) => (
                                <div key={exerciseIndex} className="bg-gray-50 rounded-lg p-4">
                                  <div className="mb-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <div className="flex items-center">
                                          <EditableExerciseField
                                            exercise={exercise}
                                            routineIndex={routineIndex}
                                            exerciseIndex={exerciseIndex}
                                            field="name"
                                            onFieldUpdate={updateExerciseField}
                                          />
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <MuscleGroupSelector
                                            exercise={exercise}
                                            routineIndex={routineIndex}
                                            exerciseIndex={exerciseIndex}
                                            onFieldUpdate={updateExerciseField}
                                          />
                                          <CardioToggle
                                            exercise={exercise}
                                            routineIndex={routineIndex}
                                            exerciseIndex={exerciseIndex}
                                            onFieldUpdate={updateExerciseField}
                                          />
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={() => duplicateExercise(routineIndex, exerciseIndex)}
                                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                                          title="Duplicate this exercise"
                                        >
                                          <Copy className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                                        </button>
                                        <button
                                          onClick={() => deleteExercise(routineIndex, exerciseIndex)}
                                          className="p-1 hover:bg-red-100 rounded transition-colors"
                                          title="Delete this exercise"
                                        >
                                          <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                  {exercise.notes && (<EditableExerciseField
                                    exercise={exercise}
                                    routineIndex={routineIndex}
                                    exerciseIndex={exerciseIndex}
                                    field="notes"
                                    onFieldUpdate={updateExerciseField}
                                  />)}

                                  {/* Sets Table */}
                                  {exercise.sets && exercise.sets.length > 0 && (
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-sm">
                                        <thead>
                                          <tr className="border-b">
                                            <th className="text-left p-2">Set</th>
                                            {availableFields.hasReps && <th className="text-left p-2">Reps</th>}
                                            {availableFields.hasWeight && <th className="text-left p-2">Weight</th>}
                                            {availableFields.hasRpe && <th className="text-left p-2">RPE</th>}
                                            {availableFields.hasRest && <th className="text-left p-2">Rest</th>}
                                            {availableFields.hasNotes && <th className="text-left p-2">Notes</th>}
                                            <th className="text-left p-2">Actions</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {exercise.sets.map((set, setIndex) => (
                                            <tr key={setIndex} className="border-b">
                                              <td className="p-2 font-medium">{setIndex + 1}</td>
                                              {availableFields.hasReps && (
                                                <td className="p-2">
                                                  <Input
                                                    value={set.reps || ""}
                                                    onChange={(e) =>
                                                      updateSetField(
                                                        routineIndex,
                                                        exerciseIndex,
                                                        setIndex,
                                                        "reps",
                                                        e.target.value,
                                                      )
                                                    }
                                                    className="w-20"
                                                  />
                                                </td>
                                              )}
                                              {availableFields.hasWeight && (
                                                <td className="p-2">
                                                  <Input
                                                    value={set.weight || ""}
                                                    onChange={(e) =>
                                                      updateSetField(
                                                        routineIndex,
                                                        exerciseIndex,
                                                        setIndex,
                                                        "weight",
                                                        e.target.value,
                                                      )
                                                    }
                                                    className="w-24"
                                                  />
                                                </td>
                                              )}
                                              {availableFields.hasRpe && (
                                                <td className="p-2">
                                                  <Input
                                                    value={set.rpe || ""}
                                                    onChange={(e) =>
                                                      updateSetField(
                                                        routineIndex,
                                                        exerciseIndex,
                                                        setIndex,
                                                        "rpe",
                                                        e.target.value,
                                                      )
                                                    }
                                                    className="w-16"
                                                  />
                                                </td>
                                              )}
                                              {availableFields.hasRest && (
                                                <td className="p-2">
                                                  <Input
                                                    value={set.rest || ""}
                                                    onChange={(e) =>
                                                      updateSetField(
                                                        routineIndex,
                                                        exerciseIndex,
                                                        setIndex,
                                                        "rest",
                                                        e.target.value,
                                                      )
                                                    }
                                                    className="w-20"
                                                  />
                                                </td>
                                              )}
                                              {availableFields.hasNotes && (
                                                <td className="p-2">
                                                  <Input
                                                    value={set.notes || ""}
                                                    onChange={(e) =>
                                                      updateSetField(
                                                        routineIndex,
                                                        exerciseIndex,
                                                        setIndex,
                                                        "notes",
                                                        e.target.value,
                                                      )
                                                    }
                                                    className="w-32"
                                                  />
                                                </td>
                                              )}
                                              <td className="p-2">
                                                <div className="flex gap-1">
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={createSafeClickHandler(
                                                      () => duplicateSet(routineIndex, exerciseIndex, setIndex),
                                                      `duplicateSet-${routineIndex}-${exerciseIndex}-${setIndex}`,
                                                    )}
                                                    title="Duplicate set"
                                                  >
                                                    <Copy className="h-3 w-3" />
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={createSafeClickHandler(
                                                      () => removeSet(routineIndex, exerciseIndex, setIndex),
                                                      `removeSet-${routineIndex}-${exerciseIndex}-${setIndex}`,
                                                    )}
                                                    title="Remove set"
                                                  >
                                                    <Trash2 className="h-3 w-3" />
                                                  </Button>
                                                </div>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                      <div className="mt-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={createSafeClickHandler(
                                            () => addSet(routineIndex, exerciseIndex),
                                            `addSet-${routineIndex}-${exerciseIndex}`,
                                          )}
                                        >
                                          <Plus className="h-3 w-3 mr-1" />
                                          Add Set
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>
        ) : // Show single routine template for non-periodized programs
        currentRoutines.length > 0 ? (
          <div className="space-y-4">
            {currentRoutines.map((routine, routineIndex) => (
              <Card key={routineIndex} className="border-l-4 border-l-blue-500">
                <div className="p-4">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={createSafeClickHandler(
                      () => toggleRoutineExpansion(routineIndex),
                      `toggleRoutineExpansion-${routineIndex}`,
                    )}
                  >
                    <div>
                      <h3 className="font-medium">{routine.name || routine.title || `Routine ${routineIndex + 1}`}</h3>
                      <p className="text-sm text-gray-600">{routine.exercises?.length || 0} exercises</p>
                    </div>
                    {expandedRoutines[routineIndex] ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>

                  {expandedRoutines[routineIndex] && (
                    <div className="mt-4 space-y-4">
                      {routine.exercises?.map((exercise, exerciseIndex) => (
                        <div key={exerciseIndex} className="bg-gray-50 rounded-lg p-4">
                          <div className="mb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center">
                                  <EditableExerciseField
                                    exercise={exercise}
                                    routineIndex={routineIndex}
                                    exerciseIndex={exerciseIndex}
                                    field="name"
                                    onFieldUpdate={updateExerciseField}
                                  />
                                </div>
                                <div className="flex items-center space-x-2">
                                  <MuscleGroupSelector
                                    exercise={exercise}
                                    routineIndex={routineIndex}
                                    exerciseIndex={exerciseIndex}
                                    onFieldUpdate={updateExerciseField}
                                  />
                                  <CardioToggle
                                    exercise={exercise}
                                    routineIndex={routineIndex}
                                    exerciseIndex={exerciseIndex}
                                    onFieldUpdate={updateExerciseField}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => duplicateExercise(routineIndex, exerciseIndex)}
                                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                                  title="Duplicate this exercise"
                                >
                                  <Copy className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                                </button>
                                <button
                                  onClick={() => deleteExercise(routineIndex, exerciseIndex)}
                                  className="p-1 hover:bg-red-100 rounded transition-colors"
                                  title="Delete this exercise"
                                >
                                  <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
                                </button>
                              </div>
                            </div>
                          </div>
                            {exercise.notes && (<EditableExerciseField
                            exercise={exercise}
                            routineIndex={routineIndex}
                            exerciseIndex={exerciseIndex}
                            field="notes"
                            onFieldUpdate={updateExerciseField}
                          />)}

                          {/* Sets Table */}
                          {exercise.sets && exercise.sets.length > 0 && (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left p-2">Set</th>
                                    {availableFields.hasReps && <th className="text-left p-2">Reps</th>}
                                    {availableFields.hasWeight && <th className="text-left p-2">Weight</th>}
                                    {availableFields.hasRpe && <th className="text-left p-2">RPE</th>}
                                    {availableFields.hasRest && <th className="text-left p-2">Rest</th>}
                                    {availableFields.hasNotes && <th className="text-left p-2">Notes</th>}
                                    <th className="text-left p-2">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {exercise.sets.map((set, setIndex) => (
                                    <tr key={setIndex} className="border-b">
                                      <td className="p-2 font-medium">{setIndex + 1}</td>
                                      {availableFields.hasReps && (
                                        <td className="p-2">
                                          <Input
                                            value={set.reps || ""}
                                            onChange={(e) =>
                                              updateSetField(
                                                routineIndex,
                                                exerciseIndex,
                                                setIndex,
                                                "reps",
                                                e.target.value,
                                              )
                                            }
                                            className="w-20"
                                          />
                                        </td>
                                      )}
                                      {availableFields.hasWeight && (
                                        <td className="p-2">
                                          <Input
                                            value={set.weight || ""}
                                            onChange={(e) =>
                                              updateSetField(
                                                routineIndex,
                                                exerciseIndex,
                                                setIndex,
                                                "weight",
                                                e.target.value,
                                              )
                                            }
                                            className="w-24"
                                          />
                                        </td>
                                      )}
                                      {availableFields.hasRpe && (
                                        <td className="p-2">
                                          <Input
                                            value={set.rpe || ""}
                                            onChange={(e) =>
                                              updateSetField(
                                                routineIndex,
                                                exerciseIndex,
                                                setIndex,
                                                "rpe",
                                                e.target.value,
                                              )
                                            }
                                            className="w-16"
                                          />
                                        </td>
                                      )}
                                      {availableFields.hasRest && (
                                        <td className="p-2">
                                          <Input
                                            value={set.rest || ""}
                                            onChange={(e) =>
                                              updateSetField(
                                                routineIndex,
                                                exerciseIndex,
                                                setIndex,
                                                "rest",
                                                e.target.value,
                                              )
                                            }
                                            className="w-20"
                                          />
                                        </td>
                                      )}
                                      {availableFields.hasNotes && (
                                        <td className="p-2">
                                          <Input
                                            value={set.notes || ""}
                                            onChange={(e) =>
                                              updateSetField(
                                                routineIndex,
                                                exerciseIndex,
                                                setIndex,
                                                "notes",
                                                e.target.value,
                                              )
                                            }
                                            className="w-32"
                                          />
                                        </td>
                                      )}
                                      <td className="p-2">
                                        <div className="flex gap-1">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={createSafeClickHandler(
                                              () => duplicateSet(routineIndex, exerciseIndex, setIndex),
                                              `duplicateSet-${routineIndex}-${exerciseIndex}-${setIndex}`,
                                            )}
                                            title="Duplicate set"
                                          >
                                            <Copy className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={createSafeClickHandler(
                                              () => removeSet(routineIndex, exerciseIndex, setIndex),
                                              `removeSet-${routineIndex}-${exerciseIndex}-${setIndex}`,
                                            )}
                                            title="Remove set"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <div className="mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={createSafeClickHandler(
                                    () => addSet(routineIndex, exerciseIndex),
                                    `addSet-${routineIndex}-${exerciseIndex}`,
                                  )}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add Set
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No routines found in this program.</p>
          </div>
        )}
      </Card>

      {/* Send to Client Dialog */}
      {showSendDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Send Program to Client</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="client-select">Select Client</Label>
                  <select
                    id="client-select"
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Choose a client...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} {client.email && `(${client.email})`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="custom-message">Custom Message (Optional)</Label>
                  <Textarea
                    id="custom-message"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Add a personal message for your client..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={createSafeClickHandler(() => setShowSendDialog(false), "setShowSendDialog-false")}
                    disabled={isSending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createSafeClickHandler(handleSendToClient, "handleSendToClient")}
                    disabled={!selectedClientId || isSending}
                  >
                    {isSending ? "Sending..." : "Send Program"}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Send to Client Sucess */}
      {showSendSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <div className="p-8 text-center flex flex-col items-center">
              <img
                src="/images/dumbbell_sparkles.png"
                alt="Program sent illustration"
                className="w-24 mb-6 mt-10"
              />

              <h3 className="text-[18px] font-semibold mb-2">
                Program sent to client
              </h3>

              <p className="text-[#9C9695] text-[16px] px-9 leading-6 mb-16 max-w-sm">
                Success! Your client will receive a notification about their new program.
              </p>

              <div className="w-full flex justify-end">
                <Button
                  variant="outline"
                  disabled={isSending}
                  onClick={createSafeClickHandler(
                    () => setShowSendSuccess(false),
                    "setShowSendSuccess-false"
                  )}>
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Confirmation Dialog for leaving without saving */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Unsaved Changes</h3>
              <p className="text-gray-600 mb-4">
                You have unsaved changes. Are you sure you want to leave without saving?
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={createSafeClickHandler(() => setShowConfirmDialog(false), "setShowConfirmDialog-false")}
                >
                  Cancel
                </Button>
                <Button variant="destructive" onClick={createSafeClickHandler(confirmLeave, "confirmLeave")}>
                  Leave Without Saving
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Periodization Dialog */}
      {showPeriodizationDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {periodizationAction === "to-periodized" ? "Convert to Periodized" : "Convert to Non-Periodized"}
              </h3>

              {periodizationAction === "to-periodized" ? (
                <div className="space-y-4">
                  <p className="text-gray-600">
                    This will create {numberOfWeeks} different weeks using your current routines as a template.
                  </p>
                  <div>
                    <Label htmlFor="weeks-count">Number of Weeks</Label>
                    <Input
                      id="weeks-count"
                      type="number"
                      min="2"
                      max="52"
                      value={numberOfWeeks}
                      onChange={(e) => setNumberOfWeeks(Number.parseInt(e.target.value) || 4)}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600">
                    This will convert to a single routine template that repeats for {programState?.duration_weeks}{" "}
                    weeks. Choose which week's routines to keep:
                  </p>
                  <div>
                    <Label htmlFor="week-select">Week to Keep</Label>
                    <select
                      id="week-select"
                      value={selectedWeekToKeep}
                      onChange={(e) => setSelectedWeekToKeep(Number.parseInt(e.target.value))}
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                    >
                      {programState?.weeks?.map((week) => (
                        <option key={week.week_number} value={week.week_number}>
                          Week {week.week_number}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end mt-6">
                <Button
                  variant="outline"
                  onClick={createSafeClickHandler(
                    () => setShowPeriodizationDialog(false),
                    "setShowPeriodizationDialog-false",
                  )}
                >
                  Cancel
                </Button>
                <Button onClick={createSafeClickHandler(confirmPeriodizationChange, "confirmPeriodizationChange")}>
                  Convert
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
