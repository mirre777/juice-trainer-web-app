"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronDown, ChevronUp, Copy, Trash2, Calendar, RotateCcw, Plus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  const [programNotes, setProgramNotes] = useState(importData.program?.notes || "")
  const [weeks, setWeeks] = useState(importData.program?.weeks || [])
  const [expandedRoutines, setExpandedRoutines] = useState<Record<string, boolean>>({ "0": true })
  const [isPeriodized, setIsPeriodized] = useState(importData.program?.is_periodized || false)
  const [isSaving, setIsSaving] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const programWeeks = weeks.length || 4

  // Get current week data
  const getCurrentWeekData = () => {
    return weeks.find((week) => week.week_number === currentWeek) || weeks[0]
  }

  const currentWeekData = getCurrentWeekData()
  const currentRoutines = currentWeekData?.routines || []

  // Week navigation
  const goToPreviousWeek = () => setCurrentWeek(Math.max(1, currentWeek - 1))
  const goToNextWeek = () => setCurrentWeek(Math.min(programWeeks, currentWeek + 1))

  // Toggle between periodized and non-periodized
  const togglePeriodization = () => {
    setIsPeriodized(!isPeriodized)
    setHasChanges(true)
    setJustSaved(false)
  }

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
          is_periodized: isPeriodized,
        },
        status: "reviewed",
        updatedAt: new Date(),
      })
      setHasChanges(false)
      setJustSaved(true)
    } catch (error) {
      console.error("Error saving program:", error)
      alert("Failed to save changes. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  // Add empty set to exercise
  const addSet = (routineIndex: number, exerciseIndex: number) => {
    const updatedWeeks = [...weeks]
    const weekIndex = updatedWeeks.findIndex((w) => w.week_number === currentWeek)

    if (weekIndex !== -1) {
      const exercise = updatedWeeks[weekIndex].routines[routineIndex].exercises[exerciseIndex]
      const newSetNumber = (exercise.sets?.length || 0) + 1

      const newSet = {
        set_number: newSetNumber,
        warmup: false,
        reps: "",
        weight: "",
        rpe: "",
        rest: "",
        duration: "",
        notes: "",
      }

      if (!exercise.sets) exercise.sets = []
      exercise.sets.push(newSet)

      setWeeks(updatedWeeks)
      setHasChanges(true)
      setJustSaved(false)
    }
  }

  // Duplicate specific set
  const duplicateSet = (routineIndex: number, exerciseIndex: number, setIndex: number) => {
    const updatedWeeks = [...weeks]
    const weekIndex = updatedWeeks.findIndex((w) => w.week_number === currentWeek)

    if (weekIndex !== -1) {
      const exercise = updatedWeeks[weekIndex].routines[routineIndex].exercises[exerciseIndex]
      const setToDuplicate = exercise.sets[setIndex]

      const duplicatedSet = {
        ...setToDuplicate,
        set_number: setToDuplicate.set_number + 1,
      }

      // Update set numbers for sets after the insertion point
      for (let i = setIndex + 1; i < exercise.sets.length; i++) {
        exercise.sets[i].set_number += 1
      }

      exercise.sets.splice(setIndex + 1, 0, duplicatedSet)

      setWeeks(updatedWeeks)
      setHasChanges(true)
      setJustSaved(false)
    }
  }

  // Delete set
  const deleteSet = (routineIndex: number, exerciseIndex: number, setIndex: number) => {
    const updatedWeeks = [...weeks]
    const weekIndex = updatedWeeks.findIndex((w) => w.week_number === currentWeek)

    if (weekIndex !== -1) {
      const exercise = updatedWeeks[weekIndex].routines[routineIndex].exercises[exerciseIndex]
      exercise.sets.splice(setIndex, 1)

      // Update set numbers
      exercise.sets.forEach((set, index) => {
        set.set_number = index + 1
      })

      setWeeks(updatedWeeks)
      setHasChanges(true)
      setJustSaved(false)
    }
  }

  const updateSetField = (routineIndex: number, exerciseIndex: number, setIndex: number, field: string, value: any) => {
    const updatedWeeks = [...weeks]
    const weekIndex = updatedWeeks.findIndex((w) => w.week_number === currentWeek)

    if (weekIndex !== -1) {
      const exercise = updatedWeeks[weekIndex].routines[routineIndex].exercises[exerciseIndex]
      if (exercise.sets && exercise.sets[setIndex]) {
        exercise.sets[setIndex][field] = value
        setWeeks(updatedWeeks)
        setHasChanges(true)
        setJustSaved(false)
      }
    }
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

  // Get button text based on state
  const getButtonText = () => {
    if (isSaving) return "Saving..."
    if (justSaved && !hasChanges) return "Saved"
    return "Save Changes"
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
            className={
              justSaved && !hasChanges
                ? "bg-lime-400 text-gray-800 cursor-not-allowed opacity-75"
                : "bg-lime-400 hover:bg-lime-500 text-gray-800"
            }
            onClick={handleSaveChanges}
            disabled={isSaving || (justSaved && !hasChanges)}
          >
            {isSaving ? (
              "Saving..."
            ) : justSaved && !hasChanges ? (
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                Saved
              </div>
            ) : (
              "Save Changes"
            )}
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
                setJustSaved(false)
              }}
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="program-weeks" className="block text-sm font-medium text-gray-700 mb-1">
              Program Weeks
            </label>
            <span className="text-sm text-gray-500">{programWeeks} weeks</span>
          </div>
        </div>

        {/* Periodization Toggle */}
        <div className="mb-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">Periodization</h3>
              <p className="text-sm text-gray-500">
                {isPeriodized
                  ? "Program changes week by week with different training variables"
                  : "Same routine repeated each week"}
              </p>
            </div>
            <Button
              variant={isPeriodized ? "default" : "outline"}
              onClick={togglePeriodization}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              {isPeriodized ? "Periodized" : "Non-Periodized"}
            </Button>
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
              setJustSaved(false)
            }}
            className="w-full min-h-[100px]"
            placeholder="Add notes about this program..."
          />
        </div>
      </Card>

      {/* Week Navigation (only show if periodized) */}
      {isPeriodized && (
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={goToPreviousWeek} disabled={currentWeek === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="text-center">
                <div className="text-lg font-semibold">Week {currentWeek}</div>
                <Badge className={getWeekPhase(currentWeek).color}>{getWeekPhase(currentWeek).name} Phase</Badge>
              </div>

              <Button variant="outline" size="sm" onClick={goToNextWeek} disabled={currentWeek === programWeeks}>
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">
                {currentWeek} of {programWeeks} weeks
              </span>
            </div>
          </div>

          {/* Week selector dots */}
          <div className="flex justify-center mt-4 gap-1">
            {Array.from({ length: programWeeks }, (_, i) => i + 1).map((week) => (
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

      {/* Routines for Current Week */}
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
                      {routine.exercises?.length || 0} exercises
                      {isPeriodized && ` • Week ${currentWeek} view`}
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
                          {/* Exercise sets */}
                          {exercise.sets && exercise.sets.length > 0 ? (
                            exercise.sets.map((set, setIndex) => (
                              <div
                                key={setIndex}
                                className="grid grid-cols-9 gap-4 py-3 px-4 items-center hover:bg-gray-50"
                              >
                                {/* Exercise name (only show on first set) */}
                                <div className="col-span-2">
                                  {setIndex === 0 && (
                                    <div>
                                      <div className="font-medium text-gray-900">{exercise.name}</div>
                                      {exercise.notes && (
                                        <div className="text-sm text-gray-500 mt-1">{exercise.notes}</div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="col-span-1 text-center text-sm text-gray-600">{set.set_number}</div>

                                <div className="col-span-1">
                                  <Input
                                    value={set.reps || ""}
                                    onChange={(e) =>
                                      updateSetField(routineIndex, exerciseIndex, setIndex, "reps", e.target.value)
                                    }
                                    className="text-center h-8 text-sm"
                                    placeholder="10"
                                  />
                                </div>

                                <div className="col-span-1">
                                  <Input
                                    value={set.weight || ""}
                                    onChange={(e) =>
                                      updateSetField(routineIndex, exerciseIndex, setIndex, "weight", e.target.value)
                                    }
                                    className="text-center h-8 text-sm"
                                    placeholder="kg"
                                  />
                                </div>

                                <div className="col-span-1">
                                  <Input
                                    value={set.rpe || ""}
                                    onChange={(e) =>
                                      updateSetField(routineIndex, exerciseIndex, setIndex, "rpe", e.target.value)
                                    }
                                    className="text-center h-8 text-sm"
                                    placeholder="7"
                                  />
                                </div>

                                <div className="col-span-1">
                                  <Input
                                    value={set.rest || ""}
                                    onChange={(e) =>
                                      updateSetField(routineIndex, exerciseIndex, setIndex, "rest", e.target.value)
                                    }
                                    className="text-center h-8 text-sm"
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
                            <div className="grid grid-cols-9 gap-4 py-3 px-4 items-center">
                              <div className="col-span-2">
                                <div className="font-medium text-gray-900">{exercise.name}</div>
                                {exercise.notes && <div className="text-sm text-gray-500 mt-1">{exercise.notes}</div>}
                              </div>
                              <div className="col-span-5 text-center text-gray-500 text-sm">No sets defined</div>
                              <div className="col-span-2"></div>
                            </div>
                          )}

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
