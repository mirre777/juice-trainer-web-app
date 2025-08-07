import { getSharedWorkout } from "@/lib/firebase/shared-workout-service"
import { getUserData } from "@/lib/firebase/user-data-service"
import { getLastWorkout } from "@/lib/firebase/workout-service"
import { ClientWorkoutView } from "@/components/client-workout-view"
import { notFound } from "next/navigation"

interface SharedWorkoutPageProps {
  params: {
    userId: string
    workoutId: string
  }
}

// Helper function to get current week range (same as overview screen)
function getCurrentWeekRange() {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Convert Sunday to 6, Monday to 0

  const monday = new Date(now)
  monday.setDate(now.getDate() - diff)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return { start: monday, end: sunday }
}

// Helper function to filter workouts to current week only
function filterCurrentWeekWorkouts(workouts: any[]) {
  if (!workouts || workouts.length === 0) return []

  const { start, end } = getCurrentWeekRange()

  return workouts.filter((workout) => {
    const workoutDate = workout?.startedAt || workout?.createdAt || workout?.date
    if (!workoutDate) return false

    let date: Date
    // Handle Firestore timestamp
    if (typeof workoutDate === "object" && workoutDate.seconds) {
      date = new Date(workoutDate.seconds * 1000)
    } else {
      date = new Date(workoutDate)
    }

    return date >= start && date <= end
  })
}

export default async function SharedWorkoutPage({ params }: SharedWorkoutPageProps) {
  const { userId, workoutId } = params

  console.log(`[SharedWorkoutPage] Loading workout ${workoutId} for user ${userId}`)

  // Fetch workout data, user data, and all user workouts for weekly tracker
  const [workoutResult, userResult, userWorkoutsResult] = await Promise.all([
    getSharedWorkout(userId, workoutId),
    getUserData(userId),
    getLastWorkout(userId),
  ])

  const { workout, error: workoutError } = workoutResult
  const { user, error: userError } = userResult
  const { workouts: allUserWorkouts, error: workoutsError } = userWorkoutsResult

  if (workoutError) {
    console.error("[SharedWorkoutPage] Error loading workout:", workoutError)
    notFound()
  }

  if (!workout) {
    console.log("[SharedWorkoutPage] Workout not found")
    notFound()
  }

  // Filter workouts to current week only (same logic as overview screen)
  const currentWeekWorkouts = filterCurrentWeekWorkouts(allUserWorkouts || [])

  // Use actual user name or fallback to "User"
  const userName = user?.name || user?.displayName || workout.clientName || "User"

  // Format date with weekday
  const formatDateWithWeekday = (dateValue: any) => {
    try {
      let date: Date

      // Handle Firestore timestamp
      if (typeof dateValue === "object" && dateValue.seconds) {
        date = new Date(dateValue.seconds * 1000)
      } else {
        date = new Date(dateValue)
      }

      if (isNaN(date.getTime())) {
        return new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      }

      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (error) {
      console.error("Error formatting date with weekday:", error)
      return new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }
  }

  const workoutDateWithWeekday = formatDateWithWeekday(
    workout.createdAt || workout.startedAt || workout.date || new Date(),
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left side - Workout Display */}
      <div className="w-full lg:w-1/2 h-screen overflow-y-auto">
        <div className="h-full">
          <ClientWorkoutView
            client={{
              id: workout.clientId || userId,
              name: userName,
              image: user?.image || workout.clientImage,
              date: workoutDateWithWeekday,
              // Don't show program tags for shared workouts
              programWeek: undefined,
              programTotal: undefined,
              daysCompleted: undefined,
              daysTotal: undefined,
              userId: userId,
            }}
            workout={{
              id: workoutId,
              name: workout.name,
              focus: workout.focus,
              clientNote: workout.notes || workout.clientNote,
              date: workout.createdAt || workout.startedAt || workout.date,
              completedAt: workout.completedAt,
              userId: userId,
              clientId: workout.clientId,
            }}
            exercises={workout.exercises || []}
            personalRecords={workout.personalRecords || []}
            isMockData={false}
            showInteractionButtons={false}
            allClientWorkouts={allUserWorkouts || []}
            weeklyWorkouts={currentWeekWorkouts} // Only pass current week workouts
            isPublicPage={true}
          />
        </div>
      </div>

      {/* Right side - Juice Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-white items-center justify-center p-8">
        <div className="max-w-md text-center space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Juice</h1>
            <p className="text-lg text-gray-600">Track your clients' fitness journey</p>
          </div>

          <div className="space-y-4">
            <p className="text-gray-700">
              The complete coaching platform for personal trainers. Manage clients, create programs, track progress, and
              grow your business.
            </p>
          </div>

          <div className="space-y-3">
            <a
              href="/login"
              className="block w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Login
            </a>
            <a
              href="/signup"
              className="block w-full py-3 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Sign Up
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
