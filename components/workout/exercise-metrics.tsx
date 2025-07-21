import type React from "react"
import Link from "next/link"

interface ExerciseMetricsProps {
  exerciseId: string
}

const ExerciseMetrics: React.FC<ExerciseMetricsProps> = ({ exerciseId }) => {
  return (
    <div>
      {/* Exercise Metrics Content */}
      <p>Metrics for exercise ID: {exerciseId}</p>

      <Link
        href={`/demo/exercise-history/${exerciseId}`}
        className="text-sm font-medium text-gray-600 hover:text-gray-900 border-b border-primary"
      >
        View history
      </Link>
    </div>
  )
}

export { ExerciseMetrics }
