"use client"

import type React from "react"

import { useState } from "react"
import { useProgramContext } from "@/contexts/program-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DEFAULT_EXERCISE_CATEGORIES, type ProgramExercise } from "@/types/workout-program"

interface AddExerciseFormProps {
  routineIndex: number
  programWeeks: number
  onComplete: () => void
}

export default function AddExerciseForm({ routineIndex, programWeeks, onComplete }: AddExerciseFormProps) {
  const { addExerciseToRoutine } = useProgramContext()
  const [selectedCategory, setSelectedCategory] = useState("")
  const [exerciseName, setExerciseName] = useState("")
  const [exerciseVideo, setExerciseVideo] = useState("")
  const [exerciseNotes, setExerciseNotes] = useState("")
  const [customExercise, setCustomExercise] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!exerciseName || !selectedCategory) return

    // Create default weeks
    const weeks = []
    for (let i = 1; i <= programWeeks; i++) {
      weeks.push({
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

    const newExercise: ProgramExercise = {
      exercise: exerciseName,
      exercise_category: selectedCategory,
      exercise_video: exerciseVideo || null,
      exercise_notes: exerciseNotes || null,
      weeks,
    }

    addExerciseToRoutine(routineIndex, newExercise)
    onComplete()
  }

  // Find exercises for the selected category
  const categoryExercises = selectedCategory
    ? DEFAULT_EXERCISE_CATEGORIES.find((cat) => cat.name === selectedCategory)?.exercises || []
    : []

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Exercise Category</label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {DEFAULT_EXERCISE_CATEGORIES.map((category) => (
                <SelectItem key={category.name} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Exercise</label>
          {customExercise || categoryExercises.length === 0 ? (
            <Input
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              placeholder="Enter exercise name"
            />
          ) : (
            <Select value={exerciseName} onValueChange={setExerciseName}>
              <SelectTrigger>
                <SelectValue placeholder="Select exercise" />
              </SelectTrigger>
              <SelectContent>
                {categoryExercises.map((exercise) => (
                  <SelectItem key={exercise} value={exercise}>
                    {exercise}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {selectedCategory && (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="custom-exercise"
            checked={customExercise}
            onChange={() => setCustomExercise(!customExercise)}
            className="rounded border-gray-300"
          />
          <label htmlFor="custom-exercise" className="text-sm">
            Add custom exercise
          </label>
        </div>
      )}

      <div>
        <label className="text-sm font-medium mb-1 block">Video URL (optional)</label>
        <Input
          value={exerciseVideo}
          onChange={(e) => setExerciseVideo(e.target.value)}
          placeholder="https://example.com/video"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Notes (optional)</label>
        <Textarea
          value={exerciseNotes}
          onChange={(e) => setExerciseNotes(e.target.value)}
          placeholder="Any notes about this exercise..."
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onComplete}>
          Cancel
        </Button>
        <Button type="submit" disabled={!exerciseName || !selectedCategory}>
          Add Exercise
        </Button>
      </div>
    </form>
  )
}
