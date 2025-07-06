"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

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

export default function ReviewProgramClient({ importData, importId, initialClients = [] }: ReviewProgramClientProps) {
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
  const [isTogglingPeriodization, setIsTogglingPeriodization] = useState(false)
  const [expandedRoutines, setExpandedRoutines] = useState<{ [key: number]: boolean }>({ 0: true })
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // Analyze available fields in the program data
  const availableFields = useMemo((): AvailableFields => {
    if (!programState) {
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

    let hasReps = false
    let hasWeight = false
    let hasRpe = false
    let hasRest = false
    let hasNotes = false

    // Check all exercises and sets to see what fields exist
    for (const routine of currentRoutines) {
      for (const exercise of routine.exercises || []) {
        for (const set of exercise.sets || []) {
          if (set.reps !== undefined && set.reps !== null && set.reps !== "") hasReps = true
          if (set.weight !== undefined && set.weight !== null && set.weight !== "") hasWeight = true
          if (set.rpe !== undefined && set.rpe !== null && set.rpe !== "") hasRpe = true
          if (set.rest !== undefined && set.rest !== null && set.rest !== "") hasRest = true
          if (set.notes !== undefined && set.notes !== null && set.notes !== "") hasNotes = true
        }
      }
    }

    console.log("[ReviewProgramClient] Available fields analysis:", {
      hasReps,
      hasWeight,
      hasRpe,
      hasRest,
      hasNotes,
    })

    return { hasReps, hasWeight, hasRpe, hasRest, hasNotes }
  }, [programState])

  // Initialize program state from import data
  useEffect(() => {
    console.log("[ReviewProgramClient] Initializing with importData:", importData)

    try {
      setIsLoading(true)
      setError(null)

      if (!importData) {
        console.log("[ReviewProgramClient] No import data provided")
        setError("No import data provided")
        setIsLoading(false)
        return
      }

      if (!importData.program) {
        console.log("[ReviewProgramClient] No program data found in import")
        setError("No program data found in import")
        setIsLoading(false)
        return
      }

      // Extract program data with multiple fallback field names
      const program = importData.program
      console.log("[ReviewProgramClient] Program data structure:", {
        hasWeeks: !!program.weeks,
        hasRoutines: !!program.routines,
        weeksLength: program.weeks?.length,
        routinesLength: program.routines?.length,
        programTitle: program.program_title || program.title || program.name,
        availableFields: Object.keys(program),
      })

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

      console.log("[ReviewProgramClient] Created program state:", {
        name: programState.name,
        duration_weeks: programState.duration_weeks,
        hasWeeks: !!programState.weeks?.length,
        hasRoutines: !!programState.routines?.length,
        is_periodized: programState.is_periodized,
      })

      setProgramState(programState)
      setIsLoading(false)
    } catch (err) {
      console.error("[ReviewProgramClient] Error initializing program state:", err)
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
    try {
      const response = await fetch("/api/clients", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
        console.log("[ReviewProgramClient] Fetched clients from API:", data.clients?.length || 0)
      } else {
        console.error("Failed to fetch clients from API")
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
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
          status: "reviewed",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save changes")
      }

      toast({
        title: "Changes Saved",
        description: "Your program changes have been saved successfully.",
      })
      setHasChanges(false)
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
    if (!selectedClientId || !programState) {
      toast({
        title: "Missing Information",
        description: "Please select a client and ensure program data is loaded.",
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
        programName: programState.name || programState.program_title,
      })

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
      console.log("[ReviewProgramClient] Program sent successfully:", result)

      toast({
        title: "Program Sent Successfully!",
        description: `The program "${programState.name || programState.program_title}" has been sent to ${selectedClient.name}.`,
      })

      setSelectedClientId("")
      setCustomMessage("")
      setShowSendDialog(false)
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

  const handleTogglePeriodization = async (checked: boolean) => {
    if (!programState) return

    setIsTogglingPeriodization(true)

    try {
      console.log("[ReviewProgramClient] Toggling periodization:", {
        from: programState.is_periodized,
        to: checked,
      })

      const response = await fetch("/api/programs/toggle-periodization", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          programData: {
            ...programState,
            is_periodized: checked, // Set the target state
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to toggle periodization")
      }

      const result = await response.json()
      console.log("[ReviewProgramClient] Periodization toggled successfully:", result)

      // Update the program state with the converted structure
      setProgramState(result.program)
      setHasChanges(true)

      toast({
        title: "Periodization Updated",
        description: checked
          ? "Program converted to periodized format with different routines per week"
          : "Program converted to non-periodized format with same routines repeated",
      })

      // Reset expanded routines to show first routine
      setExpandedRoutines({ 0: true })
    } catch (error) {
      console.error("[ReviewProgramClient] Error toggling periodization:", error)
      toast({
        title: "Failed to Toggle Periodization",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsTogglingPeriodization(false)
    }
  }

  const updateProgramField = (field: keyof Program, value: any) => {
    if (!programState) return
    setProgramState((prev) => ({
      ...prev!,
      [field]: value,
    }))
    setHasChanges(true)
  }

  const toggleRoutineExpansion = (index: number) => {
    setExpandedRoutines((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const updateSetField = (routineIndex: number, exerciseIndex: number, setIndex: number, field: string, value: any) => {
    if (!programState) return

    setProgramState((prev) => {
      const newState = { ...prev! }

      // Handle both periodized (weeks) and non-periodized (routines) structures
      let targetRoutines: Routine[] = []

      if (newState.weeks && newState.weeks.length > 0) {
        // Periodized program - use first week's routines for now
        targetRoutines = newState.weeks[0].routines
      } else if (newState.routines) {
        // Non-periodized program
        targetRoutines = newState.routines
      }

      if (targetRoutines[routineIndex]?.exercises[exerciseIndex]?.sets?.[setIndex]) {
        targetRoutines[routineIndex].exercises[exerciseIndex].sets![setIndex] = {
          ...targetRoutines[routineIndex].exercises[exerciseIndex].sets![setIndex],
          [field]: value,
        }
      }

      return newState
    })
    setHasChanges(true)
  }

  const addSet = (routineIndex: number, exerciseIndex: number) => {
    if (!programState)\
