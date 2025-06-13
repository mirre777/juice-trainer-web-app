"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { WorkoutProgram, WorkoutRoutine, ProgramExercise } from "@/types/workout-program"

interface ProgramContextType {
  program: WorkoutProgram | null
  setProgram: React.Dispatch<React.SetStateAction<WorkoutProgram | null>>
  saveProgram: () => Promise<void>
  createNewProgram: (title: string, weeks: number) => void
  addRoutine: (routineName: string) => void
  updateRoutine: (index: number, routine: WorkoutRoutine) => void
  deleteRoutine: (index: number) => void
  addExerciseToRoutine: (routineIndex: number, exercise: ProgramExercise) => void
  updateExerciseInRoutine: (routineIndex: number, exerciseIndex: number, exercise: ProgramExercise) => void
  deleteExerciseFromRoutine: (routineIndex: number, exerciseIndex: number) => void
  loading: boolean
}

const ProgramContext = createContext<ProgramContextType | undefined>(undefined)

export const useProgramContext = () => {
  const context = useContext(ProgramContext)
  if (context === undefined) {
    throw new Error("useProgramContext must be used within a ProgramProvider")
  }
  return context
}

export const ProgramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [program, setProgram] = useState<WorkoutProgram | null>(null)
  const [loading, setLoading] = useState(false)

  // Load program from localStorage on initial render
  useEffect(() => {
    const savedProgram = localStorage.getItem("workoutProgram")
    if (savedProgram) {
      try {
        setProgram(JSON.parse(savedProgram))
      } catch (error) {
        console.error("Failed to parse saved program:", error)
      }
    }
  }, [])

  const saveProgram = async () => {
    if (!program) return

    setLoading(true)
    try {
      // Save to localStorage for now
      localStorage.setItem("workoutProgram", JSON.stringify(program))

      // In a real app, you would also save to your backend
      // await fetch('/api/programs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(program)
      // });

      console.log("Program saved successfully")
    } catch (error) {
      console.error("Failed to save program:", error)
    } finally {
      setLoading(false)
    }
  }

  const createNewProgram = (title: string, weeks: number) => {
    const newProgram: WorkoutProgram = {
      program_title: title,
      program_notes: "",
      program_weeks: weeks,
      routine_count: 0,
      routines: [],
    }
    setProgram(newProgram)
  }

  const addRoutine = (routineName: string) => {
    if (!program) return

    const newRoutine: WorkoutRoutine = {
      routine_name: routineName,
      routine_rank: `${program.routines.length + 1}`,
      exercises: [],
    }

    setProgram((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        routine_count: prev.routine_count + 1,
        routines: [...prev.routines, newRoutine],
      }
    })
  }

  const updateRoutine = (index: number, routine: WorkoutRoutine) => {
    if (!program) return

    setProgram((prev) => {
      if (!prev) return prev
      const updatedRoutines = [...prev.routines]
      updatedRoutines[index] = routine
      return {
        ...prev,
        routines: updatedRoutines,
      }
    })
  }

  const deleteRoutine = (index: number) => {
    if (!program) return

    setProgram((prev) => {
      if (!prev) return prev
      const updatedRoutines = prev.routines.filter((_, i) => i !== index)
      return {
        ...prev,
        routine_count: prev.routine_count - 1,
        routines: updatedRoutines,
      }
    })
  }

  const addExerciseToRoutine = (routineIndex: number, exercise: ProgramExercise) => {
    if (!program) return

    setProgram((prev) => {
      if (!prev) return prev
      const updatedRoutines = [...prev.routines]
      updatedRoutines[routineIndex] = {
        ...updatedRoutines[routineIndex],
        exercises: [...updatedRoutines[routineIndex].exercises, exercise],
      }
      return {
        ...prev,
        routines: updatedRoutines,
      }
    })
  }

  const updateExerciseInRoutine = (routineIndex: number, exerciseIndex: number, exercise: ProgramExercise) => {
    if (!program) return

    setProgram((prev) => {
      if (!prev) return prev
      const updatedRoutines = [...prev.routines]
      const updatedExercises = [...updatedRoutines[routineIndex].exercises]
      updatedExercises[exerciseIndex] = exercise
      updatedRoutines[routineIndex] = {
        ...updatedRoutines[routineIndex],
        exercises: updatedExercises,
      }
      return {
        ...prev,
        routines: updatedRoutines,
      }
    })
  }

  const deleteExerciseFromRoutine = (routineIndex: number, exerciseIndex: number) => {
    if (!program) return

    setProgram((prev) => {
      if (!prev) return prev
      const updatedRoutines = [...prev.routines]
      updatedRoutines[routineIndex] = {
        ...updatedRoutines[routineIndex],
        exercises: updatedRoutines[routineIndex].exercises.filter((_, i) => i !== exerciseIndex),
      }
      return {
        ...prev,
        routines: updatedRoutines,
      }
    })
  }

  const value = {
    program,
    setProgram,
    saveProgram,
    createNewProgram,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    addExerciseToRoutine,
    updateExerciseInRoutine,
    deleteExerciseFromRoutine,
    loading,
  }

  return <ProgramContext.Provider value={value}>{children}</ProgramContext.Provider>
}
