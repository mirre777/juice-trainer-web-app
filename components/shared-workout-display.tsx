import type React from "react"
import type { FirebaseWorkout } from "@/lib/firebase/workout-service"
import Link from "next/link"

interface SharedWorkoutDisplayProps {
  workout?: FirebaseWorkout
  userId?: string
  workoutId?: string
  clientId?: string
}

const SharedWorkoutDisplay: React.FC<SharedWorkoutDisplayProps> = ({ workout, userId, workoutId, clientId }) => {
  // Add a check for undefined workout
  if (!workout) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-center text-gray-500">No workout data available</p>
      </div>
    )
  }

  return (
    <div className="bg-white h-full p-6 overflow-y-auto">
      {/* Client Header */}
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
          <span className="text-lg font-semibold text-gray-600">
            {workout.clientName ? workout.clientName.charAt(0).toUpperCase() : "U"}
          </span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{workout.clientName || "User"}</h1>
          <p className="text-sm text-gray-500">{workout.date}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-sm text-gray-500">Program week 3/8</p>
          <p className="text-sm text-gray-500">Days 3/4</p>
        </div>
      </div>

      {/* Week Calendar */}
      <div className="flex space-x-2 mb-6">
        {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
          <div
            key={day}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              index === 2 ? "bg-lime-400 text-black" : "bg-gray-100 text-gray-600"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Status Badge */}
      <div className="flex items-center mb-4">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
          {workout.status === "completed" ? "COMPLETED" : "HAPPENING NOW"}
        </span>
      </div>

      {/* Workout Title */}
      <h2 className="text-2xl font-bold mb-4">{workout.name}</h2>

      {/* Client Note */}
      {workout.notes && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-sm font-medium text-gray-900 mb-1">Client Note:</p>
          <p className="text-sm text-gray-700">{workout.notes}</p>
        </div>
      )}

      {/* Exercise Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {workout.exercises.slice(0, 4).map((exercise, index) => (
          <div key={exercise.id || index} className="bg-yellow-50 p-3 rounded-lg">
            <h3 className="font-medium text-sm mb-1">{exercise.name}</h3>
            <p className="text-xs text-gray-600">
              {exercise.sets?.[0]?.weight ? `${exercise.sets[0].weight} kg` : "Bodyweight"} ×{" "}
              {exercise.sets?.[0]?.reps || "N/A"}
            </p>
            {exercise.sets?.[0]?.weight === 0 && <p className="text-xs text-orange-600">Not Completed</p>}
          </div>
        ))}
      </div>

      {/* Detailed Exercise View */}
      {workout.exercises.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">{workout.exercises[0].name}</h3>
            {clientId && workout.exercises[0].id && (
              <Link
                href={`/exercise-history/${clientId}/${workout.exercises[0].id}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View history
              </Link>
            )}
          </div>

          <div className="mb-2">
            <p className="text-sm text-gray-600">Highest</p>
            <p className="font-semibold">
              {workout.exercises[0].sets?.[0]?.weight || 0} kg × {workout.exercises[0].sets?.[0]?.reps || 0} reps
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Sets</p>
            {workout.exercises[0].sets?.map((set, index) => (
              <div key={set.id || index} className="flex justify-between items-center py-1">
                <span className="text-sm">{index + 1}</span>
                <span className="text-sm">
                  {set.weight} kg × {set.reps} reps
                </span>
              </div>
            )) || <p className="text-sm text-gray-500">No sets recorded</p>}
          </div>
        </div>
      )}

      {/* Personal Records */}
      <div>
        <h3 className="text-lg font-medium mb-4">Recent Personal Records</h3>
        {workout.personalRecords && workout.personalRecords.length > 0 ? (
          <div className="space-y-2">
            {workout.personalRecords.map((record, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">{record.exercise}</span>
                <span className="text-sm text-green-600">{record.weight}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-500">No personal records available yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Personal records will appear here as clients achieve new milestones
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export { SharedWorkoutDisplay }
export default SharedWorkoutDisplay
