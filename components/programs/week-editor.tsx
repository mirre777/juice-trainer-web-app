"use client"

import { useProgramContext } from "@/contexts/program-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2 } from "lucide-react"
import type { WorkoutSet } from "@/types/workout-program"

interface WeekEditorProps {
  routineIndex: number
  exerciseIndex: number
  weekNumber: number
}

export default function WeekEditor({ routineIndex, exerciseIndex, weekNumber }: WeekEditorProps) {
  const { program, updateExerciseInRoutine } = useProgramContext()

  if (!program) return null

  const exercise = program.routines[routineIndex].exercises[exerciseIndex]
  const week = exercise.weeks.find((w) => w.week_number === weekNumber)

  if (!week) return null

  const updateWeek = (updatedWeek: typeof week) => {
    const updatedExercise = { ...exercise }
    const weekIndex = updatedExercise.weeks.findIndex((w) => w.week_number === weekNumber)

    if (weekIndex !== -1) {
      updatedExercise.weeks[weekIndex] = updatedWeek
      updateExerciseInRoutine(routineIndex, exerciseIndex, updatedExercise)
    }
  }

  const addSet = () => {
    const newSet: WorkoutSet = {
      set_number: week.sets.length + 1,
      warmup: false,
      reps: 10,
      rpe: 7,
      rest: "60s",
      notes: null,
    }

    updateWeek({
      ...week,
      set_count: week.set_count + 1,
      sets: [...week.sets, newSet],
    })
  }

  const deleteSet = (setNumber: number) => {
    const updatedSets = week.sets.filter((set) => set.set_number !== setNumber)

    // Renumber the sets
    updatedSets.forEach((set, index) => {
      set.set_number = index + 1
    })

    updateWeek({
      ...week,
      set_count: updatedSets.length,
      sets: updatedSets,
    })
  }

  const updateSet = (setNumber: number, field: keyof WorkoutSet, value: any) => {
    const updatedSets = [...week.sets]
    const setIndex = updatedSets.findIndex((set) => set.set_number === setNumber)

    if (setIndex !== -1) {
      updatedSets[setIndex] = {
        ...updatedSets[setIndex],
        [field]: value,
      }

      updateWeek({
        ...week,
        sets: updatedSets,
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2 text-left">Set</th>
              <th className="p-2 text-left">Warmup</th>
              <th className="p-2 text-left">Reps</th>
              <th className="p-2 text-left">RPE</th>
              <th className="p-2 text-left">Rest</th>
              <th className="p-2 text-left">Notes</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {week.sets.map((set) => (
              <tr key={set.set_number} className="border-b">
                <td className="p-2">{set.set_number}</td>
                <td className="p-2">
                  <Checkbox
                    checked={set.warmup}
                    onCheckedChange={(checked) => updateSet(set.set_number, "warmup", checked === true)}
                  />
                </td>
                <td className="p-2">
                  <Input
                    value={set.reps?.toString() || ""}
                    onChange={(e) => updateSet(set.set_number, "reps", e.target.value)}
                    className="w-20"
                  />
                </td>
                <td className="p-2">
                  <Input
                    value={set.rpe?.toString() || ""}
                    onChange={(e) => updateSet(set.set_number, "rpe", e.target.value)}
                    className="w-20"
                  />
                </td>
                <td className="p-2">
                  <Input
                    value={set.rest || ""}
                    onChange={(e) => updateSet(set.set_number, "rest", e.target.value)}
                    className="w-20"
                    placeholder="60s"
                  />
                </td>
                <td className="p-2">
                  <Input
                    value={set.notes || ""}
                    onChange={(e) => updateSet(set.set_number, "notes", e.target.value)}
                    className="w-full"
                    placeholder="Notes"
                  />
                </td>
                <td className="p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSet(set.set_number)}
                    className="text-red-500 h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete set</span>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button variant="outline" onClick={addSet} className="w-full">
        <Plus className="h-4 w-4 mr-1" /> Add Set
      </Button>
    </div>
  )
}
