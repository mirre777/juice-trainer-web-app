"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Trophy, Activity } from "lucide-react"
import { PersonalRecordsDisplay } from "@/components/shared/personal-records-display"
import { WeeklyTracker } from "@/components/shared/weekly-tracker"
import { getDayOfWeek, getDayName } from "@/lib/utils/date-utils"
import { useToast } from "@/hooks/use-toast"

interface ExerciseSet {
  number: number
  weight: string
  reps: string
  isPersonalRecord?: boolean
  notes?: string
}

interface Exercise {
  id: string
  name: string
  weight: string
  reps: string
  completed: boolean
  note?: boolean
  sets?: ExerciseSet[]
}

interface PersonalRecord {
  exercise: string
  weight: string
  reps: string
  date: string
  isPersonalRecord?: boolean
}

interface WorkoutReaction {
  emoji: string
  trainerId: string
  timestamp: any // Firestore timestamp
}

interface WorkoutComment {
  comment: string
  trainerId: string
  timestamp: any // Firestore timestamp
}

interface ClientWorkoutViewProps {
  client?: {
    id: string
    name: string
    image?: string
    date: string
    programWeek?: string
    programTotal?: string
    daysCompleted?: string
    daysTotal?: string
    userId?: string
  }
  workout?: {
    id?: string
    name?: string
    day?: string
    focus?: string
    clientNote?: string
    date?: string | Date | any
    completedAt?: string | Date | null
    reactions?: WorkoutReaction[]
    comments?: WorkoutComment[]
    docPath?: string
    userId?: string
    clientId?: string
    createdAt?: any // Added createdAt field
    startedAt?: any // Added startedAt field
  }
  exercises?: Exercise[]
  personalRecords?: PersonalRecord[]
  onEmojiSelect?: (emoji: string) => void
  onComment?: (comment: string) => void
  isMockData?: boolean
  allClientWorkouts?: any[]
  trainerId?: string
  clientId?: string
  userId?: string
  weeklyWorkouts?: any[]
  showInteractionButtons?: boolean
  isPublicPage?: boolean
}

export function ClientWorkoutView({
  client,
  workout,
  exercises = [],
  personalRecords,
  onEmojiSelect,
  onComment,
  isMockData = false,
  allClientWorkouts = [],
  trainerId,
  clientId,
  userId,
  weeklyWorkouts = [],
  showInteractionButtons = true,
  isPublicPage = false,
}: ClientWorkoutViewProps) {
  // State for selected exercise
  const [selectedExercise, setSelectedExercise] = useState<string>(exercises[0]?.id || "")

  // State for emoji picker and comment input
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const [commentInputVisible, setCommentInputVisible] = useState(false)
  const [comment, setComment] = useState("")

  // State for pulsing animation
  const [isPulsing, setIsPulsing] = useState(true)

  // State for real-time workout completion status
  const [isWorkoutCompleted, setIsWorkoutCompleted] = useState(!!workout?.completedAt)

  // Refs for overflow detection
  const exercisesContainerRef = useRef<HTMLDivElement>(null)
  const commentInputRef = useRef<HTMLInputElement>(null)

  // States for overflow detection
  const [exercisesOverflow, setExercisesOverflow] = useState(false)

  // States for scroll position
  const [showLeftExerciseArrow, setShowLeftExerciseArrow] = useState(false)
  const [showRightExerciseArrow, setShowRightExerciseArrow] = useState(true)

  // Toast for notifications
  const { toast } = useToast()

  // Debug logging for props
  useEffect(() => {
    console.log("[ClientWorkoutView] Component mounted with props:", {
      clientId: client?.id,
      workoutId: workout?.id,
      userId,
      trainerId,
      isMockData,
      hasWorkoutId: !!workout?.id,
      workoutKeys: Object.keys(workout || {}),
    })
  }, [client, workout, userId, trainerId, isMockData])

  // Format workout date from createdAt or startedAt
  const formatWorkoutDate = (workout: any) => {
    try {
      // Try to get the date from startedAt first, then createdAt, then date
      const dateValue = workout?.startedAt || workout?.createdAt || workout?.date

      if (!dateValue) {
        return "Unknown Date"
      }

      // Handle Firestore timestamp
      if (typeof dateValue === "object" && dateValue.seconds) {
        const date = new Date(dateValue.seconds * 1000)
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      }

      // Handle string date
      const parsedDate = new Date(dateValue)
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      }

      return client?.date || "Unknown Date"
    } catch (error) {
      console.error("Error formatting workout date:", error)
      return client?.date || "Unknown Date"
    }
  }

  // Early return if critical data is missing
  if (!client) {
    console.warn("[ClientWorkoutView] client prop is undefined")
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">Client data not available</p>
      </div>
    )
  }

  if (!workout) {
    console.warn("[ClientWorkoutView] workout prop is undefined")
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">Workout data not available</p>
      </div>
    )
  }

  if (!exercises || !Array.isArray(exercises)) {
    console.warn("[ClientWorkoutView] exercises prop is undefined or not an array")
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">No exercise data available</p>
      </div>
    )
  }

  // Get the currently selected exercise data
  const currentExercise = exercises.find((ex) => ex?.id === selectedExercise) || exercises[0]

  // Get workout day information from the actual date
  const workoutDayOfWeek = workout?.date ? getDayOfWeek(workout.date) : null
  const workoutDayName = workoutDayOfWeek !== null ? getDayName(workoutDayOfWeek) : null

  // Calculate active days based on weekly workouts
  const getActiveDaysFromWeeklyWorkouts = () => {
    if (isMockData) {
      return [0, 2, 4] // Mock: Monday, Wednesday, Friday
    }

    if (!weeklyWorkouts || weeklyWorkouts.length === 0) {
      return []
    }

    const activeDays = new Set<number>()

    weeklyWorkouts.forEach((workout) => {
      const workoutDate = workout?.startedAt || workout?.createdAt
      if (workoutDate) {
        let date: Date | null = null

        // Handle Firestore timestamp
        if (typeof workoutDate === "object" && workoutDate.seconds) {
          date = new Date(workoutDate.seconds * 1000)
        } else {
          date = new Date(workoutDate)
        }

        if (date && !isNaN(date.getTime())) {
          // Get day of week (0 = Sunday, 1 = Monday, etc.)
          // Convert to our format (0 = Monday, 1 = Tuesday, etc.)
          const dayOfWeek = date.getDay()
          const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Convert Sunday from 0 to 6
          activeDays.add(adjustedDay)
        }
      }
    })

    return Array.from(activeDays)
  }

  const activeDays = getActiveDaysFromWeeklyWorkouts()

  // For real data, we'll highlight the current workout day based on the date
  const currentWorkoutDay = !isMockData && workoutDayOfWeek !== null ? workoutDayOfWeek : null

  // Check if workout is happening now (has no completedAt date and not completed via listener)
  const isHappeningNow = !workout.completedAt && !isWorkoutCompleted && !isMockData

  // Function to find highest weight set from an exercise
  const findHighestWeightSet = (exercise: Exercise) => {
    if (!exercise?.sets || exercise.sets.length === 0) {
      return { weight: `${exercise?.weight || "N/A"}`, reps: exercise?.reps || "N/A" }
    }

    let highestSet = exercise.sets[0]
    let highestWeight = Number.parseFloat(exercise.sets[0]?.weight) || 0

    exercise.sets.forEach((set) => {
      const weight = Number.parseFloat(set?.weight) || 0
      if (weight > highestWeight) {
        highestWeight = weight
        highestSet = set
      }
    })

    return { weight: `${highestSet?.weight || "N/A"}`, reps: highestSet?.reps || "N/A" }
  }

  // Get highest weight set for current exercise
  const currentExerciseHighest = currentExercise ? findHighestWeightSet(currentExercise) : { weight: "×", reps: "reps" }

  // Scroll functions for the containers
  const scrollExercises = (direction: "left" | "right") => {
    if (exercisesContainerRef.current) {
      const container = exercisesContainerRef.current
      const scrollAmount = 300

      if (direction === "left") {
        container.scrollBy({ left: -scrollAmount, behavior: "smooth" })
      } else {
        container.scrollBy({ left: scrollAmount, behavior: "smooth" })
      }
    }
  }

  // Handle exercise selection
  const handleExerciseSelect = (id: string) => {
    setSelectedExercise(id)
  }

  // Show personal records for mock data, empty state for real data
  const shouldShowPersonalRecords = isMockData

  // Get formatted date for display
  const displayDate = formatWorkoutDate(workout)

  return (
    <div className="w-full bg-white rounded-lg shadow-sm overflow-hidden relative">
      {/* Client Header */}
      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden">
            {client?.image ? (
              <Image
                src={client.image || "/placeholder.svg"}
                alt={client?.name || "Client"}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-orange-200 flex items-center justify-center">
                <span className="text-orange-500 font-medium">
                  {client?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") || "?"}
                </span>
              </div>
            )}
          </div>
          <div>
            <h2 className="text-[18px] font-bold">{client?.name || "Unknown Client"}</h2>
            <p className="text-[14px] text-gray-500">{displayDate}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {/* Program tags - only show when not on public pages */}
          {!isPublicPage && (
            <div className="flex items-center gap-2 mb-1">
              {client?.programWeek && client?.programTotal && (
                <div className="px-3 py-1 bg-gray-100 rounded-full text-[12px] text-gray-800">
                  Program week {client.programWeek}/{client.programTotal}
                </div>
              )}
              {client?.daysCompleted && client?.daysTotal && (
                <div className="px-3 py-1 bg-gray-100 rounded-full text-[12px] text-gray-800">
                  Days {client.daysCompleted}/{client.daysTotal}
                </div>
              )}
            </div>
          )}

          {/* Weekly tracker with real workout data */}
          <WeeklyTracker
            activeDays={activeDays}
            workouts={allClientWorkouts}
            currentWorkoutDate={workout?.date}
            currentWorkoutDay={currentWorkoutDay}
            isMockData={isMockData}
          />
        </div>
      </div>

      {/* Workout Content */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-6 relative">
          {/* Happening Now indicator - now with real-time updates */}
          {isHappeningNow && (
            <div
              className={`absolute -top-1 left-0 flex items-center gap-1.5 text-green-600 text-xs font-medium transition-opacity duration-300 ${isPulsing ? "animate-pulse-twice" : ""}`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>HAPPENING NOW</span>
            </div>
          )}

          {/* Show workout name */}
          <h1 className={`text-[28px] font-bold transition-all duration-300 ${isHappeningNow ? "mt-5" : ""}`}>
            {workout?.name || workout?.focus || "Unknown Workout"}
          </h1>
        </div>

        {/* Client Note */}
        {workout?.clientNote && (
          <div className="mb-6 pl-4 py-4 bg-gray-50 rounded-lg border-l-4 border-[#D2FF28]">
            <p className="font-medium mb-1 text-[14px]">Client Note:</p>
            <p className="text-gray-700 text-[12px]">{workout.clientNote}</p>
          </div>
        )}

        {/* Exercise Cards */}
        <div className="mb-8 relative">
          <div
            ref={exercisesContainerRef}
            className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {exercises && exercises.length > 0 ? (
              exercises.map((exercise, index) => {
                if (!exercise) {
                  console.warn(`[ClientWorkoutView] exercise at index ${index} is undefined`)
                  return null
                }
                // Show highest weight set for each exercise card
                const highest = findHighestWeightSet(exercise)
                return (
                  <div
                    key={exercise.id || index}
                    onClick={() => handleExerciseSelect(exercise.id)}
                    className={`flex-shrink-0 p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedExercise === exercise.id
                        ? "border-[#D2FF28] bg-[#D2FF28]10"
                        : exercise.completed === false
                          ? "border-amber-200 bg-amber-50"
                          : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="w-[120px]">
                      <p className="font-medium text-sm mb-1">{exercise?.name || "Unknown Exercise"}</p>
                      {exercise.completed === false ? (
                        <p className="text-amber-600 text-xs">Not Completed</p>
                      ) : (
                        <p className="text-xs text-gray-500">
                          {highest.weight} × {highest.reps}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="p-4 text-center">
                <p className="text-gray-500">No exercises available</p>
              </div>
            )}
          </div>

          {/* Only show arrows when needed */}
          {exercisesOverflow && (
            <>
              {showLeftExerciseArrow && (
                <button
                  className="absolute left-[-12px] top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center"
                  onClick={() => scrollExercises("left")}
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}
              {showRightExerciseArrow && (
                <button
                  className="absolute right-[-12px] top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center"
                  onClick={() => scrollExercises("right")}
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Exercise Details */}
        {currentExercise && (
          <div className="mb-8 p-4 border border-gray-100 rounded-lg">
            <div className="flex items-center mb-4">
              <h3 className="text-[18px] font-semibold">{currentExercise?.name || "Unknown Exercise"}</h3>
              <Link
                href={`/exercise-history/${client?.userId || userId || "unknown"}/${currentExercise?.id || "unknown"}`}
                className="ml-2 text-xs text-black border-b-2 border-[#D2FF28] px-1 py-0.5 hover:bg-gray-50"
              >
                View history
              </Link>
            </div>

            <div className={`flex flex-col ${isMockData ? "md:flex-row" : ""} gap-8`}>
              <div className="flex flex-col">
                <div className="mb-4">
                  <p className="text-[12px] text-gray-500 mb-1">Highest</p>
                  {/* Show highest weight set from current exercise */}
                  <p className="text-[14px] font-bold">
                    {currentExerciseHighest.weight} × {currentExerciseHighest.reps} reps
                  </p>
                </div>

                <div>
                  <p className="text-[12px] text-gray-500 font-medium mb-2">Sets</p>
                  <div className="space-y-3">
                    {currentExercise?.sets && currentExercise.sets.length > 0 ? (
                      currentExercise.sets.map((set, index) => (
                        <div key={set?.number || index} className="flex items-center gap-2">
                          {/* Show set numbers in boxes */}
                          <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center">
                            <span className="text-[12px] font-medium">{set?.number || index + 1}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-[12px]">
                              {set?.weight || "N/A"} × {set?.reps || "N/A"} reps
                            </span>
                            {set?.isPR && <Trophy className="w-4 h-4 text-amber-500 ml-1" />}
                          </div>
                          {set?.notes && <span className="text-[10px] text-gray-500 ml-2">({set.notes})</span>}
                        </div>
                      ))
                    ) : (
                      <div className="text-[12px] text-gray-500">No set data available</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Personal Records Section */}
        <div className="p-6 pt-0">
          {shouldShowPersonalRecords && personalRecords && personalRecords.length > 0 ? (
            <PersonalRecordsDisplay records={personalRecords} />
          ) : (
            <div className="bg-white rounded-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Personal Records</h3>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-gray-100 p-3 mb-4">
                  <Trophy className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-2">No personal records available yet</p>
                <p className="text-gray-400 text-sm">
                  Personal records will appear here as clients achieve new milestones
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Also export as default for backward compatibility
export default ClientWorkoutView
