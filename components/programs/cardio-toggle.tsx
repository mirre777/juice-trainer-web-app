"use client"

import { ProgramExercise } from "@/types/workout-program"
import React from "react"

interface CardioToggleProps {
  exercise: ProgramExercise
  routineIndex: number
  exerciseIndex: number
  onFieldUpdate: (routineIndex: number, exerciseIndex: number, field: string, value: any) => void
}

export function CardioToggle({
  exercise,
  routineIndex,
  exerciseIndex,
  onFieldUpdate,
}: CardioToggleProps) {
  const handleClick = () => {
    console.log("CardioToggle clicked:", {
      routineIndex,
      exerciseIndex,
      currentValue: exercise.isCardio,
      newValue: !exercise.isCardio
    })
    onFieldUpdate(routineIndex, exerciseIndex, "isCardio", !exercise.isCardio)
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
        exercise.isCardio
          ? "bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-300"
          : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-300"
      }`}
    >
      Cardio
    </button>
  )
}
