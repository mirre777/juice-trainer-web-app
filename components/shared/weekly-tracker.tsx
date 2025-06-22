"use client"

interface WeeklyTrackerProps {
  activeDays?: number[]
  daysLabels?: string[]
  workouts?: any[]
  currentWorkoutDate?: string | Date | any
  currentWorkoutDay?: number | null
  isMockData?: boolean
}

// Add a function to check if the workout is from last week
function isFromLastWeek(date: Date | string | any): boolean {
  if (!date) return false

  // Convert to Date object if it's not already
  const workoutDate =
    date instanceof Date
      ? date
      : typeof date === "object" && date.seconds
        ? new Date(date.seconds * 1000)
        : new Date(date)

  const today = new Date()

  // Get the start of the current week (Monday)
  const startOfCurrentWeek = new Date(today)
  const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, ...
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Adjust for Monday as first day
  startOfCurrentWeek.setDate(today.getDate() - diff)
  startOfCurrentWeek.setHours(0, 0, 0, 0)

  // Get the start of last week
  const startOfLastWeek = new Date(startOfCurrentWeek)
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)

  // Check if workout date is in last week
  return workoutDate >= startOfLastWeek && workoutDate < startOfCurrentWeek
}

export function WeeklyTracker({
  activeDays = [],
  daysLabels = ["M", "T", "W", "T", "F", "S", "S"],
  workouts = [],
  currentWorkoutDate,
  currentWorkoutDay,
  isMockData = false,
}: WeeklyTrackerProps) {
  // Determine if we should show the "last week" label
  const showLastWeekLabel = !isMockData && isFromLastWeek(currentWorkoutDate)

  return (
    <div className="flex flex-col items-end">
      {showLastWeekLabel && <div className="text-xs text-gray-500 mb-1 mr-1">last week</div>}
      <div className="flex items-center gap-2">
        {daysLabels.map((day, i) => {
          const isActive = activeDays.includes(i)
          const isCurrentDay = !isMockData && currentWorkoutDay === i

          return (
            <div
              key={i}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                isCurrentDay
                  ? "bg-primary text-black"
                  : isActive
                    ? "bg-primary text-black"
                    : "bg-gray-200 text-gray-500"
              }`}
            >
              {day}
            </div>
          )
        })}
      </div>
    </div>
  )
}
