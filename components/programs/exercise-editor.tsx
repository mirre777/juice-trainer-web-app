"use client"

import { useState } from "react"
import { useProgramContext } from "@/contexts/program-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, Video } from "lucide-react"
import type { ExerciseWeek } from "@/types/workout-program"
import WeekEditor from "./week-editor"

interface ExerciseEditorProps {
  routineIndex: number
  exerciseIndex: number
  programWeeks: number
}

export default function ExerciseEditor({ routineIndex, exerciseIndex, programWeeks }: ExerciseEditorProps) {
  const { program, updateExerciseInRoutine, deleteExerciseFromRoutine } = useProgramContext()
  const [activeWeek, setActiveWeek] = useState("1")

  if (!program) return null

  const exercise = program.routines[routineIndex].exercises[exerciseIndex]

  const handleExerciseChange = (field: string, value: string) => {
    updateExerciseInRoutine(routineIndex, exerciseIndex, {
      ...exercise,
      [field]: value,
    })
  }

  const handleDeleteExercise = () => {
    if (confirm("Are you sure you want to delete this exercise?")) {
      deleteExerciseFromRoutine(routineIndex, exerciseIndex)
    }
  }

  // Ensure we have a week entry for each program week
  const ensureWeeks = () => {
    const updatedExercise = { ...exercise }

    // Create a map of existing weeks
    const weekMap = new Map()
    exercise.weeks.forEach((week) => {
      weekMap.set(week.week_number, week)
    })

    // Ensure all program weeks exist
    const updatedWeeks: ExerciseWeek[] = []
    for (let i = 1; i <= programWeeks; i++) {
      if (weekMap.has(i)) {
        updatedWeeks.push(weekMap.get(i))
      } else {
        // Create a default week
        updatedWeeks.push({
          week_number: i,
          set_count: 1,
          sets: [
            {
              set_number: 1,
              warmup: false,
              reps: 10,
              rpe: 7,
              rest: "60s",
              notes: null,
            },
          ],
        })
      }
    }

    updatedExercise.weeks = updatedWeeks
    updateExerciseInRoutine(routineIndex, exerciseIndex, updatedExercise)
  }

  // Call ensureWeeks when the component mounts or when programWeeks changes
  if (exercise.weeks.length !== programWeeks) {
    ensureWeeks()
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-start">
        <div className="space-y-4 w-full max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Exercise Name</label>
              <Input
                value={exercise.exercise}
                onChange={(e) => handleExerciseChange("exercise", e.target.value)}
                placeholder="Exercise name"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <Input
                value={exercise.exercise_category}
                onChange={(e) => handleExerciseChange("exercise_category", e.target.value)}
                placeholder="Category"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Video URL (optional)</label>
              <Input
                value={exercise.exercise_video || ""}
                onChange={(e) => handleExerciseChange("exercise_video", e.target.value)}
                placeholder="https://example.com/video"
              />
            </div>
            <div className="flex items-end">
              {exercise.exercise_video && (
                <Button variant="outline" size="sm" className="mb-1">
                  <Video className="h-4 w-4 mr-1" /> Preview Video
                </Button>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Notes (optional)</label>
            <Textarea
              value={exercise.exercise_notes || ""}
              onChange={(e) => handleExerciseChange("exercise_notes", e.target.value)}
              placeholder="Any notes about this exercise..."
              rows={2}
            />
          </div>
        </div>

        <Button variant="destructive" size="sm" onClick={handleDeleteExercise}>
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete exercise</span>
        </Button>
      </div>

      <div className="pt-4">
        <h3 className="text-lg font-medium mb-3">Weekly Progression</h3>
        <Tabs value={activeWeek} onValueChange={setActiveWeek}>
          <TabsList className="mb-4 flex flex-wrap">
            {exercise.weeks.map((week) => (
              <TabsTrigger key={week.week_number} value={week.week_number.toString()}>
                Week {week.week_number}
              </TabsTrigger>
            ))}
          </TabsList>

          {exercise.weeks.map((week) => (
            <TabsContent key={week.week_number} value={week.week_number.toString()}>
              <WeekEditor routineIndex={routineIndex} exerciseIndex={exerciseIndex} weekNumber={week.week_number} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}
