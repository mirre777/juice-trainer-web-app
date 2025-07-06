"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ChevronDown, ChevronUp, Copy, Trash2, Plus, ArrowLeft } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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

// Add comprehensive logging utility
const debugLog = (message: string, data?: any) => {
  console.log(`[ReviewProgramClient] ${message}`, data || "")
}

const errorLog = (message: string, error?: any) => {
  console.error(`[ReviewProgramClient ERROR] ${message}`, error || "")
}

export default function ReviewProgramClient({ importData, importId, initialClients = [] }: ReviewProgramClientProps) {
  debugLog("Component initialized with props:", {
    importData: !!importData,
    importId,
    clientCount: initialClients.length,
  })

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
  const [expandedRoutines, setExpandedRoutines] = useState<{ [key: number]: boolean }>({ 0: true })
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showPeriodizationDialog, setShowPeriodizationDialog] = useState(false)
  const [periodizationAction, setPeriodizationAction] = useState<"to-periodized" | "to-non-periodized" | null>(null)
  const [selectedWeekToKeep, setSelectedWeekToKeep] = useState<number>(1)
  const [numberOfWeeks, setNumberOfWeeks] = useState<number>(4)

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

    const currentRoutines =
      programState.weeks && programState.weeks.length > 0 ? programState.weeks[0].routines : programState.routines || []

    debugLog("Current routines for field analysis:", currentRoutines)

    let hasReps = false
    let hasWeight = false
    let hasRpe = false
    let hasRest = false
    let hasNotes = false

    // Check all exercises and sets to see what fields exist
    try {
      for (const routine of currentRoutines) {
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
  }, [programState])

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

        // Extract program data with multiple fallback field names
        const program = importData.program
        debugLog("Program data from import:", program)

        // Create program state with proper field mapping
        const programState: Program = {
          name: importData.name || program.program_title || program.title || program.name || "Untitled Program",
          program_title: program.program_title || program.title || program.name,
          description: program.description || "",
          duration_weeks: Number(program.program_weeks || program.duration_weeks || program.weeks?.length || 1),
          is_periodized: Boolean(program.is_periodized || (program.weeks && program.weeks.length > 1)),
          weeks: program.weeks || [],
          routines: program.routines || [],
          notes: program.notes || "",
        }

        debugLog("Created program state:", programState)
        setProgramState(programState)
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
            setClients(data.clients || [])
          } else {
            debugLog("Failed to fetch clients, status:", response.status)
          }
        } catch (error) {
          errorLog("Error fetching clients:", error)
        }
      } else {
        setClients(initialClients)
      }
    }

    fetchClients()
  }, [initialClients])

  const handleSaveChanges = async () => {
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
  }

  const handleSendToClient = async () => {
    debugLog("Sending program to client:", selectedClientId)

    if (!selectedClientId || !programState) {
      debugLog("Cannot send - missing client ID or program state")
      toast({
        title: "Missing Information",
        description: "Please select a client and ensure program data is loaded.",
        variant: "destructive",
      })
      return
    }

    const selectedClient = clients.find((c) => c.id === selectedClientId)
    if (!selectedClient) {
      debugLog("Selected client not found in clients list")
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
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send program")
      }

      const result = await response.json()
      debugLog("Program sent successfully:", result)

      toast({
        title: "Program Sent Successfully!",
        description: `The program "${programState.name || programState.program_title}" has been sent to ${selectedClient.name}.`,
      })

      setSelectedClientId("")
      setCustomMessage("")
      setShowSendDialog(false)
    } catch (error) {
      errorLog("Error sending program:", error)
      toast({
        title: "Failed to Send Program",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleTogglePeriodization = (checked: boolean) => {
    debugLog("Toggle periodization called with checked:", checked)
    debugLog("Current program state:", programState)

    if (!programState) {
      errorLog("Cannot toggle periodization - no program state")
      return
    }

    try {
      // Determine the action needed
      if (checked && !programState.is_periodized) {
        debugLog("Converting to periodized")
        // Converting to periodized - ask how many weeks
        setPeriodizationAction("to-periodized")
        setNumberOfWeeks(programState.duration_weeks || 4)
        setShowPeriodizationDialog(true)
      } else if (!checked && programState.is_periodized) {
        debugLog("Converting to non-periodized")
        // Converting to non-periodized - ask which week to keep
        setPeriodizationAction("to-non-periodized")
        setSelectedWeekToKeep(1)
        setShowPeriodizationDialog(true)
      } else {
        debugLog("No action needed for periodization toggle")
      }
    } catch (err) {
      errorLog("Error in handleTogglePeriodization:", err)
    }
  }

  const confirmPeriodizationChange = () => {
    debugLog("Confirming periodization change:", periodizationAction)
    debugLog("Program state before conversion:", programState)

    if (!programState || !periodizationAction) {
      errorLog("Cannot confirm periodization change - missing state or action")
      return
    }

    try {
      if (periodizationAction === "to-periodized") {
        debugLog("Converting to periodized with weeks:", numberOfWeeks)

        // Convert non-periodized to periodized by duplicating routines
        const baseRoutines = programState.routines || []
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
            duration_weeks: numberOfWeeks,
          }
          debugLog("New program state after conversion to periodized:", newState)
          return newState
        })

        toast({
          title: "Converted to Periodized",
          description: `Program converted to ${numberOfWeeks} weeks with different routines per week`,
        })
      } else if (periodizationAction === "to-non-periodized") {
        debugLog("Converting to non-periodized, keeping week:", selectedWeekToKeep)

        // Convert periodized to non-periodized by keeping selected week
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
            duration_weeks: 1,
          }
          debugLog("New program state after conversion to non-periodized:", newState)
          return newState
        })

        toast({
          title: "Converted to Non-Periodized",
          description: `Program converted using routines from Week ${selectedWeekToKeep}`,
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
  }

  const updateProgramField = (field: keyof Program, value: any) => {
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
    setHasChanges(true)
  }

  const toggleRoutineExpansion = (index: number) => {
    debugLog("Toggling routine expansion for index:", index)

    setExpandedRoutines((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const updateSetField = (routineIndex: number, exerciseIndex: number, setIndex: number, field: string, value: any) => {
    debugLog("Updating set field:", { routineIndex, exerciseIndex, setIndex, field, value })

    if (!programState) {
      debugLog("Cannot update set field - no program state")
      return
    }

    setProgramState((prev) => {
      if (!prev) return prev

      const newState = { ...prev }

      // Handle both periodized (weeks) and non-periodized (routines) structures
      let targetRoutines: Routine[] = []

      if (newState.weeks && newState.weeks.length > 0) {
        // Periodized program - use first week's routines for now
        targetRoutines = newState.weeks[0].routines
        debugLog("Using periodized routines from first week")
      } else if (newState.routines) {
        // Non-periodized program
        targetRoutines = newState.routines
        debugLog("Using non-periodized routines")
      }

      debugLog("Target routines for update:", targetRoutines)

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
  }

  const addSet = (routineIndex: number, exerciseIndex: number) => {
    debugLog("Adding set to routine:", routineIndex, "exercise:", exerciseIndex)

    if (!programState) {
      debugLog("Cannot add set - no program state")
      return
    }

    setProgramState((prev) => {
      if (!prev) return prev

      const newState = { ...prev }

      // Handle both periodized and non-periodized structures
      let targetRoutines: Routine[] = []

      if (newState.weeks && newState.weeks.length > 0) {
        targetRoutines = newState.weeks[0].routines
      } else if (newState.routines) {
        targetRoutines = newState.routines
      }

      if (targetRoutines[routineIndex]?.exercises[exerciseIndex]) {
        const exercise = targetRoutines[routineIndex].exercises[exerciseIndex]
        if (!exercise.sets) exercise.sets = []

        // Add a new set with default values
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
  }

  const removeSet = (routineIndex: number, exerciseIndex: number, setIndex: number) => {
    debugLog("Removing set from routine:", routineIndex, "exercise:", exerciseIndex, "set:", setIndex)

    if (!programState) {
      debugLog("Cannot remove set - no program state")
      return
    }

    setProgramState((prev) => {
      if (!prev) return prev

      const newState = { ...prev }

      // Handle both periodized and non-periodized structures
      let targetRoutines: Routine[] = []

      if (newState.weeks && newState.weeks.length > 0) {
        targetRoutines = newState.weeks[0].routines
      } else if (newState.routines) {
        targetRoutines = newState.routines
      }

      if (targetRoutines[routineIndex]?.exercises[exerciseIndex]?.sets) {
        targetRoutines[routineIndex].exercises[exerciseIndex].sets!.splice(setIndex, 1)
        debugLog("Removed set successfully")
      }

      return newState
    })
    setHasChanges(true)
  }

  const duplicateSet = (routineIndex: number, exerciseIndex: number, setIndex: number) => {
    debugLog("Duplicating set from routine:", routineIndex, "exercise:", exerciseIndex, "set:", setIndex)

    if (!programState) {
      debugLog("Cannot duplicate set - no program state")
      return
    }

    setProgramState((prev) => {
      if (!prev) return prev

      const newState = { ...prev }

      // Handle both periodized and non-periodized structures
      let targetRoutines: Routine[] = []

      if (newState.weeks && newState.weeks.length > 0) {
        targetRoutines = newState.weeks[0].routines
      } else if (newState.routines) {
        targetRoutines = newState.routines
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
  }

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

  // Create safe click handlers to prevent the "j is not a function" error
  const createSafeClickHandler = (handler: () => void, handlerName: string) => {
    return () => {
      try {
        debugLog(`Executing safe click handler: ${handlerName}`)
        handler()
      } catch (err) {
        errorLog(`Error in ${handlerName}:`, err)
      }
    }
  }

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

  // Get current routines to display (either from weeks or direct routines)
  const currentRoutines =
    programState.weeks && programState.weeks.length > 0 ? programState.weeks[0].routines : programState.routines || []

  debugLog("Rendering component with current routines:", currentRoutines)

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
          {hasChanges && (
            <Button
              onClick={createSafeClickHandler(handleSaveChanges, "handleSaveChanges")}
              disabled={isSaving}
              variant="outline"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          )}
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
              onChange={(e) => updateProgramField("duration_weeks", Number.parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="md:col-span-2">
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
                  ? "Different routines for each week (periodized)"
                  : "Same routines repeated each week (non-periodized)"}
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
            <Badge variant="secondary">{currentRoutines.length} Routines</Badge>
          </div>
        </div>

        {/* Display current routines */}
        {currentRoutines.length > 0 ? (
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
                          <h4 className="font-medium mb-3">{exercise.name}</h4>
                          {exercise.notes && <p className="text-sm text-gray-600 mb-3">{exercise.notes}</p>}

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
                                            placeholder="12"
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
                                            placeholder="100"
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
                                            placeholder="8"
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
                                            placeholder="60s"
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
                                            placeholder="Notes"
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
          <div className="text-center py-8 text-gray-500">
            <p>No routines found in this program.</p>
          </div>
        )}
      </Card>

      {/* Send to Client Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Program to Client</DialogTitle>
            <DialogDescription>
              Select a client to send "{programState.name || programState.program_title}" to their mobile app.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
                        <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                          {client.initials || client.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{client.name}</span>
                        {client.email && <span className="text-gray-500 text-sm">({client.email})</span>}
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
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Add a personal message for your client..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={createSafeClickHandler(() => setShowSendDialog(false), "setShowSendDialog-false")}
            >
              Cancel
            </Button>
            <Button
              onClick={createSafeClickHandler(handleSendToClient, "handleSendToClient")}
              disabled={!selectedClientId || isSending}
            >
              {isSending ? "Sending..." : "Send Program"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Leave Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Are you sure you want to leave without saving?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={createSafeClickHandler(() => setShowConfirmDialog(false), "setShowConfirmDialog-false")}
            >
              Stay and Save
            </Button>
            <Button variant="destructive" onClick={createSafeClickHandler(confirmLeave, "confirmLeave")}>
              Leave Without Saving
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Periodization Conversion Dialog */}
      <Dialog open={showPeriodizationDialog} onOpenChange={setShowPeriodizationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {periodizationAction === "to-periodized" ? "Convert to Periodized" : "Convert to Non-Periodized"}
            </DialogTitle>
            <DialogDescription>
              {periodizationAction === "to-periodized"
                ? "How many weeks should this program run for? The current routines will be duplicated for each week."
                : "Which week's routines would you like to keep? This will become your base routine template."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {periodizationAction === "to-periodized" ? (
              <div>
                <Label htmlFor="weeks-count">Number of Weeks</Label>
                <Input
                  id="weeks-count"
                  type="number"
                  min="1"
                  max="52"
                  value={numberOfWeeks}
                  onChange={(e) => setNumberOfWeeks(Number.parseInt(e.target.value) || 4)}
                />
                <p className="text-sm text-gray-600 mt-1">
                  Current routines will be copied to each week, allowing you to customize them individually later.
                </p>
              </div>
            ) : (
              <div>
                <Label htmlFor="week-select">Select Week to Keep</Label>
                <Select
                  value={selectedWeekToKeep.toString()}
                  onValueChange={(value) => setSelectedWeekToKeep(Number.parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {programState?.weeks?.map((week) => (
                      <SelectItem key={week.week_number} value={week.week_number.toString()}>
                        Week {week.week_number} ({week.routines?.length || 0} routines)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-600 mt-1">
                  The selected week's routines will become your base template that repeats each week.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={createSafeClickHandler(() => {
                setShowPeriodizationDialog(false)
                setPeriodizationAction(null)
              }, "cancelPeriodizationDialog")}
            >
              Cancel
            </Button>
            <Button onClick={createSafeClickHandler(confirmPeriodizationChange, "confirmPeriodizationChange")}>
              {periodizationAction === "to-periodized"
                ? `Create ${numberOfWeeks} Weeks`
                : `Keep Week ${selectedWeekToKeep}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
