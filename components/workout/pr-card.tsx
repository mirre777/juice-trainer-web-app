"use client"

import { Trophy } from "lucide-react"

interface PRCardProps {
  exercise: string
  weight: string
  reps: string
  date: string
}

export function PRCard({ exercise, weight, reps, date }: PRCardProps) {
  return (
    <div className="w-[160px] h-[160px] flex-shrink-0 bg-white rounded-lg shadow-sm p-4 flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <div className="text-sm font-semibold">{exercise}</div>
        <Trophy className="w-5 h-5 text-amber-500" />
      </div>

      <div className="mt-auto">
        <div className="text-3xl font-bold">{weight}</div>
        <div className="text-sm text-gray-600">{reps} reps</div>
        <div className="text-xs text-gray-400 mt-1">{date}</div>
      </div>
    </div>
  )
}
