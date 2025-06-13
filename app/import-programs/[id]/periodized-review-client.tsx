"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronDown, ChevronUp, Copy, Trash2, Plus } from "lucide-react"
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

interface PeriodizedReviewClientProps {
  importData: any
  programData: any
}

export default function PeriodizedReviewClient({ importData, programData }: PeriodizedReviewClientProps) {
  const router = useRouter()
  const [currentWeek, setCurrentWeek] = useState(1)
  const [programTitle, setProgramTitle] = useState(
    importData.name || importData.programName || importData.program?.program_title || "Untitled Program",
  )
  const [programNotes, setProgramNotes] = useState("")
  const [weeks, setWeeks] = useState([])
  const [expandedRoutines, setExpandedRoutines] = useState<Record<string, boolean>>({ "0": true })
  const [isSaving, setIsSaving] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Initialize data from importData
  useEffect(() => {
    try {
      // Handle the data structure from the attachment
      if (importData.program?.weeks && Array.isArray(importData.program.weeks)) {
        setWeeks(importData.program.weeks)
      } else {
        // Fallback: create weeks structure from the data
        const weeksData = []

        // Check if we have the structure from the attachment
        if (importData.program && typeof importData.program === "object") {
          // Try to extract weeks from the nested structure
          const programData = importData.program

          if (programData.weeks && Array.isArray(programData.weeks)) {
            setWeeks(programData.weeks)
          } else {
            // Create a default structure
            weeksData.push({
              week_number: 1,
              routines: programData.routines || [],
            })
            setWeeks(weeksData)
          }
        }
      }

      if (importData.program?.notes) {
        setProgramNotes(importData.program.notes)
      }
    } catch (error) {
      console.error("Error parsing program data:", error)
      // Create minimal structure to avoid crashes
      setWeeks([
        {
          week_number: 1,
          routines: [],
        },
      ])
    }
  }, [importData])

  const programWeeks = weeks.length || 1
  const currentWeekData = weeks.find((week) => week.week_number === currentWeek) || weeks[0]
  const currentRoutines = currentWeekData?.routines || []

  // Week navigation
  const goToPreviousWeek = () => setCurrentWeek(Math.max(1, currentWeek - 1))
  const goToNextWeek = () => setCurrentWeek(Math.min(programWeeks, currentWeek + 1))

  const toggleRoutine = (index: number) => {
    setExpandedRoutines((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true)
      await updateDoc(doc(db, "sheets_imports", importData.id), {
        name: programTitle,
        program: {
          ...importData.program,
          notes: programNotes,
          weeks: weeks,
          is_periodized: true,
        },
        status: "reviewed",
        updatedAt: new Date(),
      })
      setHasChanges(false)
      router.push("/import-programs")
      router.refresh()
    } catch (error) {
      console.error("Error saving program:", error)
      alert("Failed to save changes. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const updateSetField = (routineIndex: number, exerciseIndex: number, setIndex: number, field: string, value: any) => {
    const updatedWeeks = [...weeks]
    const weekIndex = updatedWeeks.findIndex((w) => w.week_number === currentWeek)

    if (weekIndex !== -1 && updatedWeeks[weekIndex].routines[routineIndex]?.exercises[exerciseIndex]?.sets[setIndex]) {
      updatedWeeks[weekIndex].routines[routineIndex].exercises[exerciseIndex].sets[setIndex][field] = value
      setWeeks(updatedWeeks)
      setHasChanges(true)
    }
  }

  const addSet = (routineIndex: number, exerciseIndex: number) => {
    const updatedWeeks = [...weeks]
    const weekIndex = updatedWeeks.findIndex((w) => w.week_number === currentWeek)

    if (weekIndex !== -1) {
      const exercise = updatedWeeks[weekIndex].routines[routineIndex].exercises[exerciseIndex]
      if (!exercise.sets) exercise.sets = []

      const newSet = {
        reps: "",
        weight: "",
        rpe: "",
        rest: "",
        notes: "",
      }

      exercise.sets.push(newSet)
      setWeeks(updatedWeeks)
      setHasChanges(true)
    }
  }

  const duplicateSet = (routineIndex: number, exerciseIndex: number, setIndex: number) => {
    const updatedWeeks = [...weeks]
    const weekIndex = updatedWeeks.findIndex((w) => w.week_number === currentWeek)

    if (weekIndex !== -1) {
      const exercise = updatedWeeks[weekIndex].routines[routineIndex].exercises[exerciseIndex]
      const setToDuplicate = { ...exercise.sets[setIndex] }
      exercise.sets.splice(setIndex + 1, 0, setToDuplicate)
      setWeeks(updatedWeeks)
      setHasChanges(true)
    }
  }

  const deleteSet = (routineIndex: number, exerciseIndex: number, setIndex: number) => {
    const updatedWeeks = [...weeks]
    const weekIndex = updatedWeeks.findIndex((w) => w.week_number === currentWeek)

    if (weekIndex !== -1) {
      updatedWeeks[weekIndex].routines[routineIndex].exercises[exerciseIndex].sets.splice(setIndex, 1)
      setWeeks(updatedWeeks)
      setHasChanges(true)
    }
  }

  const getRoutineColor = (index: number) => {
    const colors = ["bg-orange-500", "bg-blue-500", "bg-purple-500", "bg-green-500", "bg-pink-500", "bg-yellow-500"]
    return colors[index % colors.length]
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center mb-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-gray-700"
          onClick={() => router.push("/import-programs")}
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
          <Button variant="outline" onClick={() => setShowConfirmDialog(true)}>
            Cancel
          </Button>
          <Button
            className="bg-lime-400 hover:bg-lime-500 text-gray-800"
            onClick={handleSaveChanges}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? "Saving..." : "Save Changes"}
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
              value={programTitle}
              onChange={(e) => {
                setProgramTitle(e.target.value)
                setHasChanges(true)
              }}
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="program-weeks" className="block text-sm font-medium text-gray-700 mb-1">
              Program Weeks
            </label>
            <div className="text-sm text-gray-600">{programWeeks} weeks</div>
          </div>
        </div>

        <div>
          <label htmlFor="program-notes" className="block text-sm font-medium text-gray-700 mb-1">
            Program Notes
          </label>
          <Textarea
            id="program-notes"
            value={programNotes || ""}
            onChange={(e) => {
              setProgramNotes(e.target.value)
              setHasChanges(true)
            }}
            className="w-full min-h-[100px]"
            placeholder="Add notes about this program..."
          />
        </div>
      </Card>

      {/* Week Navigation */}
      {programWeeks > 1 && (
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={goToPreviousWeek} disabled={currentWeek === 1}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous Week
            </Button>

            <div className="text-center">
              <div className="text-lg font-semibold">Week {currentWeek}</div>
              <div className="text-sm text-gray-500">of {programWeeks} weeks</div>
            </div>

            <Button variant="outline" size="sm" onClick={goToNextWeek} disabled={currentWeek === programWeeks}>
              Next Week
              <ChevronLeft className="h-4 w-4 ml-1 rotate-180" />
            </Button>
          </div>
        </Card>
      )}

      {/* Routines */}
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
                    {routine.name?.charAt(0) || "R"}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{routine.name}</h3>
                    <p className="text-sm text-gray-500">
                      {routine.exercises?.length || 0} exercises • Week {currentWeek}
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
                      <div className="grid grid-cols-12 gap-4 py-2 px-4 bg-gray-100 rounded-t-lg text-sm font-medium text-gray-600">
                        <div className="col-span-4">Exercise</div>
                        <div className="col-span-1 text-center">Sets</div>
                        <div className="col-span-2 text-center">Reps</div>
                        <div className="col-span-1 text-center">RPE</div>
                        <div className="col-span-2 text-center">Rest</div>
                        <div className="col-span-2 text-right">Actions</div>
                      </div>

                      {routine.exercises.map((exercise, exerciseIndex) => (
                        <div key={exerciseIndex}>
                          {/* Exercise sets */}
                          {exercise.sets && exercise.sets.length > 0 ? (
                            exercise.sets.map((set, setIndex) => (
                              <div
                                key={setIndex}
                                className="grid grid-cols-12 gap-4 py-3 px-4 border-b border-gray-200 items-center"
                              >
                                <div className="col-span-4">
                                  {setIndex === 0 && (
                                    <div>
                                      <div className="font-medium text-gray-900">{exercise.name}</div>
                                      {exercise.notes && (
                                        <div className="text-sm text-gray-500 mt-1">{exercise.notes}</div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="col-span-1 text-center text-sm text-gray-600">
                                  {setIndex === 0 ? exercise.sets.length : ""}
                                </div>

                                <div className="col-span-2 text-center">
                                  <Input
                                    value={set.reps || ""}
                                    onChange={(e) =>
                                      updateSetField(routineIndex, exerciseIndex, setIndex, "reps", e.target.value)
                                    }
                                    className="text-center border-0 p-0 h-7 focus:ring-0"
                                    placeholder="10"
                                  />
                                </div>

                                <div className="col-span-1 text-center">
                                  <Input
                                    value={set.rpe || ""}
                                    onChange={(e) =>
                                      updateSetField(routineIndex, exerciseIndex, setIndex, "rpe", e.target.value)
                                    }
                                    className="text-center border-0 p-0 h-7 focus:ring-0 w-12"
                                    placeholder="7"
                                  />
                                </div>

                                <div className="col-span-2 text-center">
                                  <Input
                                    value={set.rest || ""}
                                    onChange={(e) =>
                                      updateSetField(routineIndex, exerciseIndex, setIndex, "rest", e.target.value)
                                    }
                                    className="text-center border-0 p-0 h-7 focus:ring-0"
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
                            ))
                          ) : (
                            <div className="grid grid-cols-12 gap-4 py-4 px-4 border-b border-gray-200 items-center">
                              <div className="col-span-4">
                                <div className="font-medium text-gray-900">{exercise.name}</div>
                                {exercise.notes && <div className="text-sm text-gray-500 mt-1">{exercise.notes}</div>}
                              </div>
                              <div className="col-span-6 text-center text-gray-500">No sets defined</div>
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
                          )}
                        </div>
                      ))}

                      <div className="mt-4">
                        <Button variant="outline" className="w-full" size="sm">
                          + Add Exercise
                        </Button>
                      </div>
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
          <p className="text-gray-500 mb-4">Week {currentWeek} doesn't have any workout routines yet.</p>
          <Button variant="outline">+ Add Routine</Button>
        </div>
      )}

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
