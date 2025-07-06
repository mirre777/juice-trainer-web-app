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
    if (!programState) return

    setProgramState((prev) => {
      const newState = { ...prev! }

      let targetRoutines: Routine[] = []

      if (newState.weeks && newState.weeks.length > 0) {
        targetRoutines = newState.weeks[0].routines
      } else if (newState.routines) {
        targetRoutines = newState.routines
      }

      const exercise = targetRoutines[routineIndex]?.exercises[exerciseIndex]
      if (exercise) {
        if (!exercise.sets) exercise.sets = []

        // Create new set with only the fields that exist in the program
        const newSet: any = {}
        if (availableFields.hasReps) newSet.reps = ""
        if (availableFields.hasWeight) newSet.weight = ""
        if (availableFields.hasRpe) newSet.rpe = ""
        if (availableFields.hasRest) newSet.rest = ""
        if (availableFields.hasNotes) newSet.notes = ""

        exercise.sets.push(newSet)
      }

      return newState
    })
    setHasChanges(true)
  }

  const duplicateSet = (routineIndex: number, exerciseIndex: number, setIndex: number) => {
    if (!programState) return

    setProgramState((prev) => {
      const newState = { ...prev! }

      let targetRoutines: Routine[] = []

      if (newState.weeks && newState.weeks.length > 0) {
        targetRoutines = newState.weeks[0].routines
      } else if (newState.routines) {
        targetRoutines = newState.routines
      }

      const exercise = targetRoutines[routineIndex]?.exercises[exerciseIndex]
      if (exercise?.sets?.[setIndex]) {
        const setToDuplicate = { ...exercise.sets[setIndex] }
        exercise.sets.splice(setIndex + 1, 0, setToDuplicate)
      }

      return newState
    })
    setHasChanges(true)
  }

  const deleteSet = (routineIndex: number, exerciseIndex: number, setIndex: number) => {
    if (!programState) return

    setProgramState((prev) => {
      const newState = { ...prev! }

      let targetRoutines: Routine[] = []

      if (newState.weeks && newState.weeks.length > 0) {
        targetRoutines = newState.weeks[0].routines
      } else if (newState.routines) {
        targetRoutines = newState.routines
      }

      const exercise = targetRoutines[routineIndex]?.exercises[exerciseIndex]
      if (exercise?.sets && exercise.sets.length > 1) {
        exercise.sets.splice(setIndex, 1)
      }

      return newState
    })
    setHasChanges(true)
  }

  // Calculate dynamic column spans based on available fields
  const getColumnConfig = () => {
    const columns = []
    let totalCols = 4 // Exercise name + Sets + Actions (minimum)

    if (availableFields.hasReps) {
      columns.push({ key: "reps", label: "Reps", span: 2 })
      totalCols += 2
    }
    if (availableFields.hasWeight) {
      columns.push({ key: "weight", label: "Weight", span: 2 })
      totalCols += 2
    }
    if (availableFields.hasRpe) {
      columns.push({ key: "rpe", label: "RPE", span: 1 })
      totalCols += 1
    }
    if (availableFields.hasRest) {
      columns.push({ key: "rest", label: "Rest", span: 2 })
      totalCols += 2
    }

    return { columns, totalCols }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading program...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !programState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <div className="mx-auto h-12 w-12 rounded-full border-2 border-gray-200 flex items-center justify-center">
              <span className="text-2xl">😞</span>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Program Not Found</h3>
          <p className="text-gray-500 mb-4">
            {error ||
              "We couldn't find the workout program you're looking for. It might have been deleted or the link is incorrect."}
          </p>
          <Button onClick={() => router.push("/import-programs")} className="bg-green-500 hover:bg-green-600">
            Go to Import Programs
          </Button>
        </div>
      </div>
    )
  }

  // Get routines from either weeks or direct routines
  const currentRoutines =
    programState.weeks && programState.weeks.length > 0 ? programState.weeks[0].routines : programState.routines || []

  const { columns, totalCols } = getColumnConfig()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center mb-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-gray-700"
          onClick={() => router.push("/import-programs")}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Program</h1>
          <p className="text-gray-500 text-sm">Review and edit the imported workout program before saving</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowConfirmDialog(true)}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveChanges}
            disabled={isSaving || !hasChanges}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
          <Button onClick={() => setShowSendDialog(true)} className="bg-green-500 hover:bg-green-600">
            Send to Client
          </Button>
        </div>
      </div>

      {/* Program Settings */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <Label htmlFor="program-title">Program Title</Label>
            <Input
              id="program-title"
              value={programState.name || ""}
              onChange={(e) => updateProgramField("name", e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <Label htmlFor="program-weeks">Program Weeks</Label>
            <Input
              id="program-weeks"
              type="number"
              value={programState.duration_weeks || 1}
              onChange={(e) => updateProgramField("duration_weeks", Number(e.target.value) || 1)}
              min="1"
              className="w-full"
            />
          </div>
        </div>

        <div className="mb-6">
          <Label htmlFor="program-notes">Program Notes</Label>
          <Textarea
            id="program-notes"
            value={programState.notes || ""}
            onChange={(e) => updateProgramField("notes", e.target.value)}
            className="w-full min-h-[100px]"
            placeholder="Add notes about this program..."
          />
        </div>

        {/* Periodization Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">Periodization</h3>
            <p className="text-sm text-gray-600">
              {programState.is_periodized
                ? "This program has different routines for each week"
                : "Same routines repeated each week"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={programState.is_periodized || false}
              onCheckedChange={(checked) => updateProgramField("is_periodized", checked)}
            />
            <span className="text-sm text-gray-600">Periodized</span>
          </div>
        </div>
      </Card>

      {/* Routines */}
      {currentRoutines && currentRoutines.length > 0 ? (
        <div className="space-y-4">
          {currentRoutines.map((routine, routineIndex) => (
            <div key={routineIndex} className="border border-gray-200 rounded-lg overflow-hidden">
              <div
                className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
                onClick={() => toggleRoutineExpansion(routineIndex)}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white mr-3">
                    {routine.name?.charAt(0) || "R"}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {routine.name || routine.title || `Routine ${routineIndex + 1}`}
                    </h3>
                    <p className="text-sm text-gray-500">{routine.exercises?.length || 0} exercises</p>
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
                      {/* Dynamic Header Row */}
                      <div
                        className={`grid gap-4 py-2 px-4 bg-gray-100 rounded-t-lg text-sm font-medium text-gray-600`}
                        style={{
                          gridTemplateColumns: `4fr 1fr ${columns.map((col) => `${col.span}fr`).join(" ")} 2fr`,
                        }}
                      >
                        <div>Exercise</div>
                        <div className="text-center">Sets</div>
                        {columns.map((col) => (
                          <div key={col.key} className="text-center">
                            {col.label}
                          </div>
                        ))}
                        <div className="text-right">Actions</div>
                      </div>

                      {routine.exercises.map((exercise, exerciseIndex) => (
                        <div key={exerciseIndex}>
                          {exercise.sets && exercise.sets.length > 0 ? (
                            exercise.sets.map((set, setIndex) => (
                              <div
                                key={setIndex}
                                className={`grid gap-4 py-3 px-4 border-b border-gray-200 items-center`}
                                style={{
                                  gridTemplateColumns: `4fr 1fr ${columns.map((col) => `${col.span}fr`).join(" ")} 2fr`,
                                }}
                              >
                                <div>
                                  {setIndex === 0 && (
                                    <div>
                                      <div className="font-medium text-gray-900">{exercise.name}</div>
                                      {exercise.notes && (
                                        <div className="text-sm text-gray-500 mt-1">{exercise.notes}</div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="text-center text-sm text-gray-600">
                                  {setIndex === 0 ? exercise.sets.length : ""}
                                </div>

                                {/* Dynamic Field Columns */}
                                {columns.map((col) => (
                                  <div key={col.key} className="text-center">
                                    <Input
                                      value={set[col.key as keyof typeof set] || ""}
                                      onChange={(e) =>
                                        updateSetField(routineIndex, exerciseIndex, setIndex, col.key, e.target.value)
                                      }
                                      className="text-center border-0 p-0 h-7 focus:ring-0"
                                      placeholder={
                                        col.key === "reps"
                                          ? "10"
                                          : col.key === "rpe"
                                            ? "7"
                                            : col.key === "rest"
                                              ? "60s"
                                              : ""
                                      }
                                    />
                                  </div>
                                ))}

                                <div className="flex justify-end gap-2">
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
                            ))
                          ) : (
                            <div
                              className={`grid gap-4 py-4 px-4 border-b border-gray-200 items-center`}
                              style={{ gridTemplateColumns: `4fr ${totalCols - 6}fr 2fr` }}
                            >
                              <div>
                                <div className="font-medium text-gray-900">{exercise.name}</div>
                                {exercise.notes && <div className="text-sm text-gray-500 mt-1">{exercise.notes}</div>}
                              </div>
                              <div className="text-center text-gray-500">No sets defined</div>
                              <div className="flex justify-end">
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
                          )}
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
            <ChevronDown className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No routines found</h3>
          <p className="text-gray-500 mb-4">This program doesn't have any workout routines yet.</p>
        </div>
      )}

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
                        <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                          {client.initials || client.name?.charAt(0) || "?"}
                        </div>
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
                placeholder="Add a personal message for your client..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendToClient}
              disabled={!selectedClientId || isSending}
              className="bg-green-500 hover:bg-green-600"
            >
              {isSending ? "Sending..." : "Send Program"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
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
            <Button variant="destructive" onClick={() => router.push("/import-programs")}>
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
