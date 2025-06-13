"use client"

import type React from "react"

import { useState } from "react"
import { useProgramContext } from "@/contexts/program-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Trash2, Plus } from "lucide-react"
import ExerciseEditor from "./exercise-editor"
import AddExerciseForm from "./add-exercise-form"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface RoutineEditorProps {
  routineIndex: number
  programWeeks: number
}

export default function RoutineEditor({ routineIndex, programWeeks }: RoutineEditorProps) {
  const { program, updateRoutine, deleteRoutine } = useProgramContext()
  const [showAddExercise, setShowAddExercise] = useState(false)

  if (!program) return null

  const routine = program.routines[routineIndex]

  const handleRoutineNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateRoutine(routineIndex, {
      ...routine,
      routine_name: e.target.value,
    })
  }

  const handleDeleteRoutine = () => {
    if (confirm("Are you sure you want to delete this routine?")) {
      deleteRoutine(routineIndex)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">{routine.routine_name}</h2>
          <Input
            value={routine.routine_name}
            onChange={handleRoutineNameChange}
            className="max-w-xs ml-2"
            placeholder="Routine Name"
          />
        </div>
        <Button variant="destructive" size="sm" onClick={handleDeleteRoutine}>
          <Trash2 className="h-4 w-4 mr-1" /> Delete Routine
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exercises</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {routine.exercises.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No exercises added to this routine yet.</p>
              <Button onClick={() => setShowAddExercise(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add First Exercise
              </Button>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {routine.exercises.map((exercise, exerciseIndex) => (
                <AccordionItem key={exerciseIndex} value={`exercise-${exerciseIndex}`}>
                  <AccordionTrigger className="hover:bg-gray-50 px-4 rounded-md">
                    <div className="flex items-center justify-between w-full pr-4">
                      <span>{exercise.exercise}</span>
                      <span className="text-sm text-muted-foreground">{exercise.exercise_category}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ExerciseEditor
                      routineIndex={routineIndex}
                      exerciseIndex={exerciseIndex}
                      programWeeks={programWeeks}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}

          {!showAddExercise && routine.exercises.length > 0 && (
            <Button variant="outline" className="w-full mt-4" onClick={() => setShowAddExercise(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Exercise
            </Button>
          )}

          {showAddExercise && (
            <Card className="border-dashed mt-4">
              <CardHeader>
                <CardTitle>Add New Exercise</CardTitle>
              </CardHeader>
              <CardContent>
                <AddExerciseForm
                  routineIndex={routineIndex}
                  programWeeks={programWeeks}
                  onComplete={() => setShowAddExercise(false)}
                />
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
