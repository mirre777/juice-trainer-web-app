import type React from "react"
import Link from "next/link"

interface ExerciseMetricsProps {
  exerciseId: string
  clientId?: string // Add clientId prop for exercise history route
}

const ExerciseMetrics: React.FC<ExerciseMetricsProps> = ({ exerciseId, clientId }) => {
  return (
    <div>
      {/* Exercise Metrics Content */}
      <p>Metrics for exercise ID: {exerciseId}</p>

      {clientId ? (
        <Link
          href={`/exercise-history/${clientId}/${exerciseId}`}
          className="text-sm font-medium text-gray-600 hover:text-gray-900 border-b border-primary"
        >
          View history
        </Link>
      ) : (
        <span className="text-sm text-gray-400 border-b border-gray-300">
          View history (clientId required)
        </span>
      )}
    </div>
  )
}

export { ExerciseMetrics }
