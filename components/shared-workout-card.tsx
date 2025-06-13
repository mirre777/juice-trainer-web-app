"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronDown, Dumbbell, MessageSquare, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface Exercise {
  name: string
  target: string
  sets?: number
  reps?: number
}

interface WorkoutReaction {
  trainerId: string
  emoji: string
  timestamp: any
}

interface SharedWorkoutCardsProps {
  workouts: {
    id: string
    day: string
    focus: string
    clientName: string
    clientId?: string
    userId?: string
    progress: {
      completed: number
      total: number
    }
    exercises: Exercise[]
    reactions?: WorkoutReaction[] // Add reactions field
  }[]
  onRespond: (id: string) => void
  onClose: (id: string) => void
}

// Sample data to use when no workouts are provided
const sampleWorkouts = [
  {
    id: "sample-1",
    day: "3",
    focus: "Upper Body",
    clientName: "John Doe",
    userId: "sample-user-1",
    progress: {
      completed: 2,
      total: 5,
    },
    exercises: [
      {
        name: "Bench Press",
        target: "5x5 kg",
        sets: 5,
        reps: 5,
      },
      {
        name: "Pull-ups",
        target: "3x10 kg",
        sets: 3,
        reps: 10,
      },
      {
        name: "Shoulder Press",
        target: "4x8 kg",
        sets: 4,
        reps: 8,
      },
    ],
    reactions: [
      {
        trainerId: "trainer-1",
        emoji: "💪",
        timestamp: new Date(),
      },
    ],
  },
  {
    id: "sample-2",
    day: "4",
    focus: "Lower Body",
    clientName: "Jane Smith",
    userId: "sample-user-2",
    progress: {
      completed: 3,
      total: 5,
    },
    exercises: [
      {
        name: "Squats",
        target: "5x5 kg",
        sets: 5,
        reps: 5,
      },
      {
        name: "Deadlifts",
        target: "3x8 kg",
        sets: 3,
        reps: 8,
      },
      {
        name: "Lunges",
        target: "3x12 kg",
        sets: 3,
        reps: 12,
      },
    ],
    // No reactions field - demonstrating optional nature
  },
]

export function SharedWorkoutCard({ workouts = [], onRespond, onClose }: SharedWorkoutCardsProps) {
  // Use sample data if no workouts are provided
  const initialWorkouts = workouts.length > 0 ? workouts : sampleWorkouts

  const [activeWorkouts, setActiveWorkouts] = useState([...initialWorkouts])
  const [expandedExercises, setExpandedExercises] = useState<Record<string, boolean>>({})
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null)
  const [showAnimation, setShowAnimation] = useState(false)
  const [animationEmoji, setAnimationEmoji] = useState("")
  const [showReactionButtons, setShowReactionButtons] = useState(false)
  const [savingReaction, setSavingReaction] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const emojis = ["💪", "🔥", "👏", "⭐", "🚀", "✨"]

  const handleEmojiSelect = async (emoji: string) => {
    const currentWorkout = activeWorkouts[0]

    try {
      // Input validation
      if (!emoji || typeof emoji !== "string" || emoji.trim().length === 0) {
        throw new Error("Invalid emoji provided")
      }

      if (!currentWorkout || !currentWorkout.userId || typeof currentWorkout.userId !== "string") {
        console.error("❌ Missing workout information:", { currentWorkout })
        throw new Error("Unable to save reaction - missing workout information")
      }

      if (!currentWorkout.id || typeof currentWorkout.id !== "string") {
        throw new Error("Invalid workout ID")
      }

      console.log(`🎯 Starting to save emoji ${emoji} for workout:`, {
        workoutId: currentWorkout.id,
        userId: currentWorkout.userId,
        clientName: currentWorkout.clientName,
        workoutData: currentWorkout,
      })

      setSavingReaction(true)
      setSelectedEmoji(emoji)
      setAnimationEmoji(emoji)
      setShowAnimation(true)
      setShowReactionButtons(false)

      // Validate fetch function
      if (typeof fetch !== "function") {
        throw new Error("Fetch function not available")
      }

      console.log(`📡 Making API call to save reaction...`)
      console.log(`📡 API URL: /api/workouts/${currentWorkout.id}/reactions`)
      console.log(`📡 Request body:`, {
        emoji: emoji.trim(),
        userId: currentWorkout.userId,
      })

      // Call the API endpoint with proper error handling
      const response = await fetch(`/api/workouts/${currentWorkout.id}/reactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emoji: emoji.trim(),
          userId: currentWorkout.userId,
        }),
      })

      console.log(`📡 API Response status:`, response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`📡 API Error response:`, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      let result
      try {
        result = await response.json()
        console.log(`📡 API Response data:`, result)
      } catch (parseError) {
        console.error(`📡 Failed to parse API response:`, parseError)
        throw new Error("Invalid response from server")
      }

      if (!result.success) {
        throw new Error(result.error || "Failed to save reaction")
      }

      console.log(`✅ Reaction saved successfully!`)

      toast({
        title: "Reaction Sent! 🎉",
        description: `You reacted with ${emoji} to ${currentWorkout.clientName}'s workout`,
      })

      // Update local state to show the reaction immediately
      setActiveWorkouts((prev) =>
        prev.map((workout) =>
          workout.id === currentWorkout.id
            ? {
                ...workout,
                reactions: [
                  ...(workout.reactions || []),
                  {
                    trainerId: "current-trainer-id", // This would come from auth context
                    emoji,
                    timestamp: new Date(),
                  },
                ],
              }
            : workout,
        ),
      )
    } catch (error) {
      console.error("❌ Error saving emoji reaction:", error)

      let errorMessage = "Unknown error"
      if (error instanceof Error) {
        errorMessage = error.message
      }

      toast({
        title: "Error",
        description: `Failed to save reaction: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setSavingReaction(false)

      // Reset animation after it completes
      setTimeout(() => {
        setShowAnimation(false)
      }, 3000)
    }
  }

  const handleClose = (id: string) => {
    onClose(id)
    setActiveWorkouts((prev) => prev.filter((workout) => workout.id !== id))
  }

  const toggleExercise = (exerciseName: string) => {
    setExpandedExercises((prev) => ({
      ...prev,
      [exerciseName]: !prev[exerciseName],
    }))
  }

  const handleClientNameClick = (workout: (typeof activeWorkouts)[0]) => {
    if (workout.clientId) {
      // If client exists, navigate to client details page
      router.push(`/clients/${workout.clientId}`)
    } else {
      // If client doesn't exist, navigate to clients page and trigger add client modal
      // We'll use URL parameters to indicate we want to open the modal with prefilled data
      router.push(`/clients?addClient=true&name=${encodeURIComponent(workout.clientName)}`)
    }
  }

  if (activeWorkouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg w-full border border-gray-100 shadow-sm p-6">
        <div className="w-12 h-12 bg-lime-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-6 w-6 text-lime-600" />
        </div>
        <h3 className="text-xl font-bold mb-2">You're all caught up!</h3>
        <p className="text-gray-500 text-center max-w-md">
          You've reviewed all shared workouts. Check back later for new updates from your clients.
        </p>
      </div>
    )
  }

  const EmojiAnimation = ({ show, emoji, onComplete }: { show: boolean; emoji: string; onComplete: () => void }) => {
    useEffect(() => {
      if (show) {
        const timer = setTimeout(() => {
          onComplete()
        }, 3000)
        return () => clearTimeout(timer)
      }
    }, [show, onComplete])

    if (!show) return null

    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => {
          const size = Math.random() * 16 + 8
          const duration = Math.random() * 1.5 + 1.5
          const left = Math.random() * 100
          const delay = Math.random() * 0.5
          return (
            <div
              key={i}
              className="absolute bottom-0"
              style={{
                left: `${left}%`,
                animation: `float-up ${duration}s ease-out ${delay}s forwards`,
                fontSize: `${size}px`,
                opacity: 0,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            >
              {emoji}
            </div>
          )
        })}
        <style jsx>{`
        @keyframes float-up {
          0% {
            transform: translateY(100%) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) rotate(${Math.random() * 720 - 360}deg);
            opacity: 0;
          }
        }
      `}</style>
      </div>
    )
  }

  // Floating action buttons for emoji reactions and messaging
  const FloatingActionButtons = () => {
    return (
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
        {/* Emoji reaction button */}
        <div className="relative">
          <button
            onClick={() => setShowReactionButtons(!showReactionButtons)}
            className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all border border-gray-200"
          >
            <span className="text-xl">👍</span>
          </button>

          {/* Emoji reaction options */}
          {showReactionButtons && (
            <div className="absolute right-14 top-0 bg-white rounded-full shadow-lg p-2 flex gap-2 border border-gray-200">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiSelect(emoji)}
                  disabled={savingReaction}
                  className={`w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-all ${
                    savingReaction ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <span className="text-lg">{emoji}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message button */}
        <button
          onClick={() => onRespond(activeWorkouts[0]?.id)}
          className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all border border-gray-200"
        >
          <MessageSquare className="h-5 w-5 text-gray-600" />
        </button>
      </div>
    )
  }

  // Display existing reactions
  const renderTrainerReactions = (workout: (typeof activeWorkouts)[0]) => {
    // Only render if reactions exist
    if (!workout.reactions || workout.reactions.length === 0) {
      return null
    }

    return (
      <div className="mt-4 mb-4">
        <p className="text-sm text-gray-500 mb-2">Trainer Reactions:</p>
        <div className="flex flex-wrap gap-2">
          {workout.reactions.map((reaction, index) => (
            <div key={index} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full text-sm">
              <span className="text-lg">{reaction.emoji}</span>
              <span className="text-gray-600">Trainer</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-[600px] w-full">
      {activeWorkouts.map((workout, index) => (
        <div
          key={workout.id}
          className="absolute w-full transition-all duration-300"
          style={{
            zIndex: activeWorkouts.length - index,
            top: `${index * 10}px`,
            opacity: index === 0 ? 1 : index < 3 ? 0.95 - index * 0.1 : 0,
            transform: `scale(${1 - index * 0.02})`,
            pointerEvents: index === 0 ? "auto" : "none",
          }}
        >
          <Card className="w-full overflow-hidden bg-white shadow-lg">
            {/* Emoji animation container */}
            <EmojiAnimation show={showAnimation} emoji={animationEmoji} onComplete={() => setShowAnimation(false)} />

            {/* Floating action buttons */}
            {index === 0 && <FloatingActionButtons />}

            {/* Add this right after the floating action buttons */}
            {savingReaction && (
              <div className="absolute right-4 top-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                Saving reaction...
              </div>
            )}

            <CardContent className="w-full p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold">
                    Day {workout.day} - {workout.focus}
                    <span className="text-gray-500 text-base font-normal ml-2">•</span>
                    <span
                      className="text-gray-500 text-base font-normal ml-2 cursor-pointer hover:text-black hover:underline"
                      onClick={() => handleClientNameClick(workout)}
                    >
                      {workout.clientName}
                    </span>
                  </h3>
                </div>
                <div className="bg-black text-white w-10 h-10 rounded-full flex items-center justify-center">
                  <Dumbbell className="h-5 w-5" />
                </div>
              </div>

              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">This Week</span>
                  <span className="font-medium">
                    {workout.progress.completed}/{workout.progress.total} workouts
                  </span>
                </div>
                <Progress
                  value={(workout.progress.completed / workout.progress.total) * 100}
                  className="h-2 bg-gray-100"
                  indicatorClassName="bg-primary"
                />
              </div>

              <div className="mb-6">
                <h4 className="text-xl font-bold mb-4">Exercises</h4>
                <div className="space-y-4">
                  {workout.exercises.map((exercise, idx) => (
                    <div
                      key={idx}
                      className="p-4 border border-gray-200 rounded-lg cursor-pointer"
                      onClick={() => toggleExercise(exercise.name)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-lg font-medium">{exercise.name}</p>
                          <p className="text-gray-500">Target: {exercise.target}</p>
                        </div>
                        <ChevronDown
                          className={`h-5 w-5 transition-transform ${
                            expandedExercises[exercise.name] ? "transform rotate-180" : ""
                          }`}
                        />
                      </div>

                      {expandedExercises[exercise.name] && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-sm text-gray-500">Sets</p>
                              <p className="font-medium">{exercise.sets || 4}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Reps</p>
                              <p className="font-medium">{exercise.reps || 10}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Render trainer reactions */}
              {renderTrainerReactions(workout)}

              {selectedEmoji && (
                <div className="mt-4 mb-4 flex justify-center">
                  <div className="bg-gray-100 px-3 py-1 rounded-full text-xl">{selectedEmoji}</div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={() => handleClose(workout.id)} className="bg-primary text-black hover:bg-primary/80">
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}
