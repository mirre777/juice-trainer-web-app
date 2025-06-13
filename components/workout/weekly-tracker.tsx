"use client"

type WeeklyTrackerProps = {}

export function WeeklyTracker({}: WeeklyTrackerProps) {
  // Days of the week
  const days = ["M", "T", "W", "T", "F", "S", "S"]

  // Completed days (example: Monday, Wednesday, Friday are completed)
  const completedDays = [0, 2, 4] // Indexes of completed days

  return (
    <div className="flex gap-1">
      {days.map((day, index) => (
        <div
          key={index}
          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium
            ${completedDays.includes(index) ? "bg-[#D2FF28] text-gray-800" : "bg-gray-200 text-gray-600"}`}
        >
          {day}
        </div>
      ))}
    </div>
  )
}
