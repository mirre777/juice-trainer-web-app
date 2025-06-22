"use client"

import type React from "react"

interface ExerciseCardProps {
  name: string
  sets: number
  reps: string
  weight: string
  isActive: boolean
  onClick: () => void
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ name, sets, reps, weight, isActive, onClick }) => {
  return (
    <div
      className={`rounded-lg border p-4 cursor-pointer ${isActive ? "border-primary" : "border-gray-200"}`}
      onClick={onClick}
    >
      <h3 className="text-lg font-semibold">{name}</h3>
      <div className="mt-2">
        <p>
          Sets: <span className="font-medium">{sets}</span>
        </p>
        <p>
          Reps: <span className="font-medium">{reps}</span>
        </p>
        <p>
          Weight: <span className="font-medium">{weight}</span>
        </p>
      </div>
    </div>
  )
}

export default ExerciseCard
