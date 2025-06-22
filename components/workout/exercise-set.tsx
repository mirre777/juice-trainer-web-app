import { Trophy } from "lucide-react"

interface ExerciseSetProps {
  setNumber: number
  weight: number
  reps: number
  isPR?: boolean
  notes?: string
}

export function ExerciseSet({ setNumber, weight, reps, isPR = false, notes }: ExerciseSetProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center">
        <span className="text-xs font-medium">{setNumber}</span>
      </div>
      <div className="flex items-center">
        <span className="text-xs">
          {weight} kg × {reps}
        </span>
        {isPR && <Trophy className="w-4 h-4 text-amber-500 ml-1" />}
      </div>
      {notes && <span className="text-xs text-gray-500 ml-2">({notes})</span>}
    </div>
  )
}
