"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, Clock, Target, Users, RotateCcw } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Exercise {
  name: string
  sets: Array<{
    reps?: string
    weight?: string
    rpe?: string
    rest?: string
    notes?: string
  }>
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
  id?: string
  name: string
  description?: string
  duration_weeks: number
  is_periodized: boolean
  routines?: Routine[]
  weeks?: Week[]
}

interface ReviewProgramClientProps {
  initialProgram: Program
  importId: string
}

export default function ReviewProgramClient({ initialProgram, importId }: ReviewProgramClientProps) {
  const router = useRouter()
  const [program, setProgram] = useState<Program>(initialProgram)
  const [isLoading, setIsLoading] = useState(false)
  const [showPeriodizationDialog, setShowPeriodizationDialog] = useState(false)
  const [numberOfWeeks, setNumberOfWeeks] = useState(4)
  const [selectedWeekToKeep, setSelectedWeekToKeep] = useState(1)

  // Get current routines for display
  const currentRoutines = program.weeks && program.weeks.length > 0 ? program.weeks[0].routines : program.routines || []

  // Analyze available fields in the program
  const getAvailableFields = () => {
    let hasReps = false
    let hasWeight = false
    let hasRpe = false
    let hasRest = false
    let hasNotes = false

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

    return { hasReps, hasWeight, hasRpe, hasRest, hasNotes }
  }

  const availableFields = getAvailableFields()

  const handleTogglePeriodization = () => {
    setShowPeriodizationDialog(true)
  }

  const confirmPeriodizationChange = () => {
    try {
      if (!program.is_periodized) {
        // Converting to periodized
        const baseRoutines = program.routines || []

        if (baseRoutines.length === 0) {
          toast({
            title: "Error",
            description: "No routines found to convert to periodized program.",
            variant: "destructive",
          })
          setShowPeriodizationDialog(false)
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

        setProgram((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            is_periodized: true,
            weeks,
            routines: undefined,
            duration_weeks: numberOfWeeks,
          }
        })

        toast({
          title: "Success",
          description: `Program converted to periodized with ${numberOfWeeks} weeks.`,
        })
      } else {
        // Converting to non-periodized
        const selectedWeek = program.weeks?.find((w) => w.week_number === selectedWeekToKeep)
        const routinesToKeep = selectedWeek?.routines || []

        if (routinesToKeep.length === 0) {
          toast({
            title: "Error",
            description: `No routines found in week ${selectedWeekToKeep}.`,
            variant: "destructive",
          })
          setShowPeriodizationDialog(false)
          return
        }

        // Clean routine names by removing week suffixes
        const cleanedRoutines = routinesToKeep.map((routine) => ({
          ...routine,
          name: routine.name?.replace(/ - Week \d+$/, "") || routine.name,
        }))

        setProgram((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            is_periodized: false,
            routines: cleanedRoutines,
            weeks: undefined,
            duration_weeks: 1,
          }
        })

        toast({
          title: "Success",
          description: `Program converted to non-periodized using routines from week ${selectedWeekToKeep}.`,
        })
      }
    } catch (error) {
      console.error("Error toggling periodization:", error)
      toast({
        title: "Error",
        description: "Failed to convert program. Please try again.",
        variant: "destructive",
      })
    }

    setShowPeriodizationDialog(false)
  }

  const handleSaveProgram = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/programs/send-to-client`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          importId,
          program,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save program")
      }

      toast({
        title: "Success",
        description: "Program saved successfully!",
      })

      router.push("/programs")
    } catch (error) {
      console.error("Error saving program:", error)
      toast({
        title: "Error",
        description: "Failed to save program. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Review Program</h1>
            <p className="text-gray-600">Review and edit your imported program before saving</p>
          </div>
        </div>

        {/* Program Overview */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{program.name}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={program.is_periodized ? "default" : "secondary"}>
                  {program.is_periodized ? "Periodized" : "Non-Periodized"}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTogglePeriodization}
                  className="flex items-center gap-2 bg-transparent"
                >
                  <RotateCcw className="h-4 w-4" />
                  Convert to {program.is_periodized ? "Non-Periodized" : "Periodized"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  {program.duration_weeks} {program.duration_weeks === 1 ? "Week" : "Weeks"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  {currentRoutines.length} {currentRoutines.length === 1 ? "Routine" : "Routines"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  {currentRoutines.reduce((total, routine) => total + (routine.exercises?.length || 0), 0)} Exercises
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{Object.values(availableFields).filter(Boolean).length} Field Types</span>
              </div>
            </div>
            {program.description && (
              <>
                <Separator className="my-4" />
                <div>
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-gray-600 text-sm">{program.description}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Available Fields */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Available Data Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableFields.hasReps && <Badge variant="outline">Reps</Badge>}
              {availableFields.hasWeight && <Badge variant="outline">Weight</Badge>}
              {availableFields.hasRpe && <Badge variant="outline">RPE</Badge>}
              {availableFields.hasRest && <Badge variant="outline">Rest</Badge>}
              {availableFields.hasNotes && <Badge variant="outline">Notes</Badge>}
            </div>
          </CardContent>
        </Card>

        {/* Program Structure Preview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Program Structure</CardTitle>
          </CardHeader>
          <CardContent>
            {program.is_periodized ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  This is a periodized program with {program.weeks?.length || 0} weeks. Each week may have different
                  routines and progressions.
                </p>
                {program.weeks?.slice(0, 3).map((week) => (
                  <div key={week.week_number} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Week {week.week_number}</h4>
                    <div className="space-y-2">
                      {week.routines.map((routine, routineIndex) => (
                        <div key={routineIndex} className="text-sm">
                          <span className="font-medium">{routine.name || routine.title}</span>
                          <span className="text-gray-500 ml-2">({routine.exercises?.length || 0} exercises)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {(program.weeks?.length || 0) > 3 && (
                  <p className="text-sm text-gray-500">... and {(program.weeks?.length || 0) - 3} more weeks</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  This is a non-periodized program with {currentRoutines.length} routines. The same routines will be
                  repeated each week.
                </p>
                <div className="space-y-2">
                  {currentRoutines.map((routine, routineIndex) => (
                    <div key={routineIndex} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">{routine.name || routine.title}</h4>
                      <div className="space-y-1">
                        {routine.exercises?.slice(0, 3).map((exercise, exerciseIndex) => (
                          <div key={exerciseIndex} className="text-sm text-gray-600">
                            {exercise.name} ({exercise.sets?.length || 0} sets)
                          </div>
                        ))}
                        {(routine.exercises?.length || 0) > 3 && (
                          <div className="text-sm text-gray-500">
                            ... and {(routine.exercises?.length || 0) - 3} more exercises
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleBack}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button variant="outline">Save Changes</Button>
            <Button onClick={handleSaveProgram} disabled={isLoading}>
              {isLoading ? "Saving..." : "Send to Client"}
            </Button>
          </div>
        </div>

        {/* Periodization Dialog */}
        <Dialog open={showPeriodizationDialog} onOpenChange={setShowPeriodizationDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convert to {program.is_periodized ? "Non-Periodized" : "Periodized"}</DialogTitle>
              <DialogDescription>
                {program.is_periodized
                  ? "Which week's routines would you like to keep as the base template?"
                  : "How many weeks should this program run for? The current routines will be duplicated for each week."}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {program.is_periodized ? (
                <div className="space-y-2">
                  <Label htmlFor="week-select">Select Week to Keep</Label>
                  <Select
                    value={selectedWeekToKeep.toString()}
                    onValueChange={(value) => setSelectedWeekToKeep(Number.parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {program.weeks?.map((week) => (
                        <SelectItem key={week.week_number} value={week.week_number.toString()}>
                          Week {week.week_number} ({week.routines.length} routines)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">
                    The selected week's routines will become the base template for the non-periodized program.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="weeks-input">Number of Weeks</Label>
                  <Input
                    id="weeks-input"
                    type="number"
                    min="1"
                    max="52"
                    value={numberOfWeeks}
                    onChange={(e) => setNumberOfWeeks(Number.parseInt(e.target.value) || 1)}
                  />
                  <p className="text-sm text-gray-500">
                    Current routines will be copied to each week, allowing you to customize them individually later.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPeriodizationDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmPeriodizationChange}>
                {program.is_periodized ? `Create Non-Periodized Program` : `Create ${numberOfWeeks} Weeks`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
