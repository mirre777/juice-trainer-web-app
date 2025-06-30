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
  User,
  MessageSquare,
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
import type { WorkoutProgram, WorkoutRoutine, ExerciseWeek, WorkoutSet } from "@/types/workout-program"

interface ReviewProgramClientProps {
  importData: any
}

export default function ReviewProgramClient({ importData }: ReviewProgramClientProps) {
  const router = useRouter()
  const [programState, setProgramState] = useState<WorkoutProgram | null>(null)
  const [currentWeek, setCurrentWeek] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [showSendProgramDialog, setShowSendProgramDialog] = useState(false)
  const [messageToClient, setMessageToClient] = useState("")
  const [showSelectWeekDialog, setShowSelectWeekDialog] = useState(false)
  const [selectedWeekForNonPeriodized, setSelectedWeekForNonPeriodized] = useState<number | null>(null)
  const [expandedRoutines, setExpandedRoutines] = useState<{ [key: string]: boolean }>({ "0": true })

  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [clients, setClients] = useState<any[]>([])
  const [loadingClients, setLoadingClients] = useState(false)

  // Placeholder values as client data is not directly available in importData
  const clientNameForModal = "Emilie Rentinger"
  const dateForModal = "May 9, 2025" // Or format new Date()

  const fetchClients = async () => {
    setLoadingClients(true)
    try {
      const response = await fetch("/api/clients")
      if (response.ok) {
        const clientsData = await response.json()
        setClients(clientsData)
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
    } finally {
      setLoadingClients(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  // Initialize programState from importData on component mount or importData change
  useEffect(() => {
    if (importData?.program) {
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
        if (initialProgram.weeks && initialProgram.weeks.length > 0) {
          normalizedWeeks = initialProgram.weeks
        } else if (initialProgram.routines && initialProgram.routines.length > 0) {
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
        if (initialProgram.weeks && initialProgram.weeks.length > 0) {
          normalizedWeeks = [initialProgram.weeks[0]]
        } else if (initialProgram.routines && initialProgram.routines.length > 0) {
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

      // --- NEW: Normalize set_number for all exercises in all routines/weeks ---
      normalizedWeeks.forEach((week) => {
        week.routines?.forEach((routine) => {
          routine.exercises.forEach((exercise) => {
            if (exercise.weeks && exercise.weeks.length > 0) {
              // For periodized programs, iterate through each week's sets
              exercise.weeks.forEach((exWeek) => {
                if (exWeek.sets) {
                  exWeek.sets.forEach((set, setIndex) => {
                    if (typeof set.set_number !== "number" || set.set_number <= 0) {
                      set.set_number = setIndex + 1
                    }
                  })
                }
              })
            } else if (exercise.sets) {
              // For non-periodized programs (or if 'weeks' is not used at exercise level), iterate through top-level sets
              exercise.sets.forEach((set, setIndex) => {
                if (typeof set.set_number !== "number" || set.set_number <= 0) {
                  set.set_number = setIndex + 1
                }
              })
            }
          })
        })
      })
      // --- END NEW NORMALIZATION ---

      setProgramState({
        ...initialProgram,
        weeks: normalizedWeeks,
        routines: [], // Ensure top-level routines are always empty
      })
      setCurrentWeek(1) // Always start at week 1 for display
      setHasChanges(false)
      setJustSaved(false)
    }
  }, [importData])

  // Derived state for current routines based on current week
  const currentRoutines: WorkoutRoutine[] = useMemo(() => {
    if (!programState || !programState.weeks || programState.weeks.length === 0) return []
    return programState.weeks[currentWeek - 1]?.routines || []
  }, [programState, currentWeek])

  // Week navigation
  const goToPreviousWeek = () => setCurrentWeek(Math.max(1, currentWeek - 1))
  const goToNextWeek = () => setCurrentWeek(Math.min(programState?.program_weeks || 1, currentWeek + 1))

  // Handle changes to program title and notes
  const handleProgramTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProgramState((prev) => {
      if (!prev) return prev
      return { ...prev, program_title: e.target.value }
    })
    setHasChanges(true)
    setJustSaved(false)
  }

  const handleProgramNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setProgramState((prev) => {
      if (!prev) return prev
      return { ...prev, program_notes: e.target.value }
    })
    setHasChanges(true)
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
      // If not periodized, program_weeks should always be 1, so this input should be disabled.
      // No change needed here for non-periodized as it's handled by togglePeriodization.
      return updatedProgram
    })
    setHasChanges(true)
    setJustSaved(false)
  }

  // Toggle between periodized and non-periodized
  const togglePeriodization = () => {
    if (!programState) return

    setHasChanges(true)
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
      setHasChanges(true)
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
      setHasChanges(false)
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
      setHasChanges(false)
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
    setHasChanges(true)
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
    setHasChanges(true)
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
    setHasChanges(true)
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
    setHasChanges(true)
    setJustSaved(false)
  }

  const toggleRoutine = (index: number) => {
    setExpandedRoutines((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  const getRoutineColor = (index: number) => {
    const colors = ["bg-orange-500", "bg-blue-500", "bg-purple-500", "bg-green-500", "bg-pink-500", "bg-yellow-500"]
    return colors[index % colors.length]
  }

  const getWeekPhase = (week: number) => {
    if (week <= 3) return { name: "Volume", color: "bg-blue-100 text-blue-800" }
    if (week === 4) return { name: "Deload", color: "bg-yellow-100 text-yellow-800" }
    if (week <= 7) return { name: "Intensity", color: "bg-red-100 text-red-800" }
    if (week === 8) return { name: "Deload", color: "bg-yellow-100 text-yellow-800" }
    if (week <= 11) return { name: "Peak", color: "bg-purple-100 text-purple-800" }
    return { name: "Taper", color: "bg-green-100 text-green-800" }
  }

  const handleSendProgram = async () => {
    if (!selectedClientId || !programState) {
      alert("Please select a client")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/programs/send-to-client", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trainerId: "current-trainer-id", // You'll need to get this from auth context
          clientId: selectedClientId,
          program: programState,
          message: messageToClient,
        }),
      })

      if (response.ok) {
        setShowSendProgramDialog(false)
        setMessageToClient("")
        alert("Program successfully sent to client!")
      } else {
        const errorData = await response.json()
        alert(`Failed to send program: ${errorData.message}`)
      }
    } catch (error) {
      console.error("Error sending program:", error)
      alert("Failed to send program. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (!programState) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading program...</p>
      </div>
    )
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
            className="bg-gray-900 hover:bg-gray-800 text-white flex items-center gap-2"
            onClick={() => setShowSendProgramDialog(true)}
            disabled={hasChanges || isSaving} // Disabled if there are unsaved changes
          >
            <Send className="h-4 w-4" />
            Send to Client
          </Button>
        </div>
      </div>

      {/* Program Settings */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="program-title" className="block text-sm font-medium text-gray-700 mb-1">
              Program Title
            </label>
            <Input
              id="program-title"
              value={programState.program_title}
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
              value={programState.program_weeks}
              onChange={handleProgramWeeksChange}
              className="w-full border-transparent focus:border-lime-500"
              min={1}
              disabled={!programState.is_periodized} // Disable if not periodized
            />
          </div>
        </div>

        {/* Program Notes */}
        <div className="mb-8">
          {" "}
          {/* Added mb-6 here */}
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
            {" "}
            {/* This container will push items to ends */}
            <Button variant="ghost" size="icon" onClick={goToPreviousWeek} disabled={currentWeek === 1}>
              <ChevronLeft className="h-6 w-6" /> {/* Increased size */}
            </Button>
            <div className="flex-1 text-center">
              {" "}
              {/* This will center the text */}
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
              <ChevronRight className="h-6 w-6" /> {/* Increased size */}
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
          <h3 className="text-lg font-medium text-gray-900 mb-1">No routines found</h3>
          <p className="text-gray-500 mb-4">
            {programState.is_periodized
              ? `Week ${currentWeek} doesn't have any workout routines yet.`
              : `This program doesn't have any workout routines yet.`}
          </p>
          <Button variant="outline">+ Add Routine</Button>
        </div>
      )}

      {/* Send Program Confirmation Dialog */}
      <Dialog open={showSendProgramDialog} onOpenChange={setShowSendProgramDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Sending Program</DialogTitle>
            <DialogDescription>You are about to send the following program:</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Card className="p-4">
              <h3 className="font-bold text-lg mb-2">{programState.program_title}</h3>
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <User className="h-4 w-4 mr-2" /> {clientNameForModal}
              </div>
              <div className="flex items-center text-sm text-gray-600 mb-3">
                <Calendar className="h-4 w-4 mr-2" /> {dateForModal}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Client</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-lime-500 focus:border-lime-500"
                >
                  <option value="">Choose a client...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-start text-sm text-gray-600">
                <MessageSquare className="h-4 w-4 mr-2 mt-1" />
                <Textarea
                  value={messageToClient}
                  onChange={(e) => setMessageToClient(e.target.value)}
                  placeholder="Add a message to your client (optional)"
                  className="flex-1 border-transparent focus:border-gray-300"
                  rows={3}
                />
              </div>
            </Card>

            <div className="bg-orange-100 text-orange-800 p-3 rounded-md flex items-center gap-2 text-sm">
              <Info className="h-4 w-4" />
              <span>
                We will send your client an email and app notification. They can still access their old program.
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendProgramDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-lime-400 hover:bg-lime-500 text-gray-800" onClick={handleSendProgram}>
              Send Program
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                setHasChanges(false) // Ensure changes are marked as discarded
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
              >
                Week {week.week_number}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSelectWeekDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedWeekForNonPeriodized !== null) {
                  handleSelectWeekForNonPeriodized(selectedWeekForNonPeriodized)
                }
              }}
              disabled={selectedWeekForNonPeriodized === null}
            >
              Confirm Selection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
