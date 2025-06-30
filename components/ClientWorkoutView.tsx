"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Calendar, CheckCircle, Circle, Trophy, MessageSquare } from "lucide-react"

interface Exercise {
  id: string
  name: string
  sets: number
  reps: string
  weight?: string
  notes?: string
  completed?: boolean
  isPR?: boolean
}

interface Workout {
  id: string
  title: string
  date: string
  duration?: number
  exercises: Exercise[]
  status: "pending" | "in-progress" | "completed" | "skipped"
  clientName: string
  clientAvatar?: string
  clientNote?: string
  programWeek?: string
  programTotal?: string
  daysCompleted?: string
  daysTotal?: string
}

interface ClientWorkoutViewProps {
  workoutId?: string
  clientId?: string
  workout?: Workout
  onExerciseComplete?: (exerciseId: string) => void
  onWorkoutComplete?: () => void
  showInteractionButtons?: boolean
}

export function ClientWorkoutView({
  workoutId,
  clientId,
  workout: propWorkout,
  onExerciseComplete,
  onWorkoutComplete,
  showInteractionButtons = true,
}: ClientWorkoutViewProps) {
  const [workout, setWorkout] = useState<Workout | null>(propWorkout || null)
  const [loading, setLoading] = useState(!propWorkout)
  const [error, setError] = useState<string | null>(null)
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (propWorkout) {
      setWorkout(propWorkout)
      setLoading(false)
      return
    }

    // Simulate loading workout data
    const loadWorkout = async () => {
      try {
        setLoading(true)

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Mock workout data
        const mockWorkout: Workout = {
          id: workoutId || "1",
          title: "Upper Body Strength",
          date: new Date().toISOString().split("T")[0],
          duration: 45,
          clientName: "Michael Thompson",
          clientAvatar: "/lemon-avatar.png",
          status: "in-progress",
          programWeek: "3",
          programTotal: "8",
          daysCompleted: "2",
          daysTotal: "4",
          clientNote:
            "Felt strong today but had some tightness in my right hamstring during Romanian deadlifts. Reduced the weight slightly for the last two sets.",
          exercises: [
            {
              id: "1",
              name: "Back Squat",
              sets: 5,
              reps: "5",
              weight: "120 kg",
              completed: true,
              isPR: true,
              notes: "New personal record!",
            },
            {
              id: "2",
              name: "Romanian DL",
              sets: 3,
              reps: "8",
              weight: "Not Completed",
              completed: false,
              notes: "Hamstring tightness",
            },
            {
              id: "3",
              name: "Leg Press",
              sets: 3,
              reps: "10",
              weight: "200 kg",
              completed: true,
            },
            {
              id: "4",
              name: "Leg Extension",
              sets: 3,
              reps: "12",
              weight: "70 kg",
              completed: true,
            },
          ],
        }

        setWorkout(mockWorkout)

        // Set initially completed exercises
        const completed = new Set(mockWorkout.exercises.filter((ex) => ex.completed).map((ex) => ex.id))
        setCompletedExercises(completed)
      } catch (err) {
        setError("Failed to load workout")
        console.error("Error loading workout:", err)
      } finally {
        setLoading(false)
      }
    }

    loadWorkout()
  }, [workoutId, clientId, propWorkout])

  const handleExerciseToggle = (exerciseId: string) => {
    const newCompleted = new Set(completedExercises)
    if (newCompleted.has(exerciseId)) {
      newCompleted.delete(exerciseId)
    } else {
      newCompleted.add(exerciseId)
    }
    setCompletedExercises(newCompleted)
    onExerciseComplete?.(exerciseId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error || !workout) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">{error || "Workout not found"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in-progress":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "skipped":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const completedCount = completedExercises.size
  const totalCount = workout.exercises.length
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={workout.clientAvatar || "/lemon-avatar.png"} alt={workout.clientName} />
                <AvatarFallback>
                  {workout.clientName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{workout.clientName}</CardTitle>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(workout.date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge className={getStatusColor(workout.status)}>{workout.status.replace("-", " ").toUpperCase()}</Badge>
              {workout.programWeek && workout.programTotal && (
                <p className="text-sm text-muted-foreground mt-1">
                  Week {workout.programWeek}/{workout.programTotal}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{workout.title}</h2>
              <span className="text-sm text-muted-foreground">
                {completedCount}/{totalCount} completed
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {workout.clientNote && (
            <Card className="mt-4 border-l-4 border-l-yellow-400">
              <CardContent className="p-4">
                <div className="flex items-start space-x-2">
                  <MessageSquare className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Client Note:</p>
                    <p className="text-sm text-gray-700">{workout.clientNote}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardHeader>
      </Card>

      {/* Exercises */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Exercises</h2>
        {workout.exercises.map((exercise, index) => {
          const isCompleted = completedExercises.has(exercise.id) || exercise.completed
          return (
            <Card
              key={exercise.id}
              className={`transition-all duration-200 ${isCompleted ? "bg-green-50 border-green-200" : ""}`}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <button onClick={() => handleExerciseToggle(exercise.id)} className="flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      <h3 className={`font-medium text-lg ${isCompleted ? "line-through text-gray-500" : ""}`}>
                        {index + 1}. {exercise.name}
                      </h3>
                      {exercise.isPR && <Trophy className="h-4 w-4 text-yellow-500" />}
                    </div>

                    <div className="flex items-center gap-4 ml-8 text-sm text-muted-foreground">
                      <span>{exercise.sets} sets</span>
                      <span>{exercise.reps} reps</span>
                      {exercise.weight && exercise.weight !== "Not Completed" && <span>{exercise.weight}</span>}
                    </div>

                    {exercise.notes && (
                      <p className="mt-2 ml-8 text-sm text-muted-foreground italic">Note: {exercise.notes}</p>
                    )}
                  </div>

                  {!isCompleted && (
                    <Button variant="outline" size="sm" onClick={() => handleExerciseToggle(exercise.id)}>
                      Complete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Actions */}
      {showInteractionButtons && (
        <div className="flex gap-2 justify-end">
          {workout.status === "pending" && (
            <>
              <Button variant="outline">Skip Workout</Button>
              <Button onClick={onWorkoutComplete}>Start Workout</Button>
            </>
          )}
          {workout.status === "in-progress" && completedCount === totalCount && (
            <Button onClick={onWorkoutComplete} className="bg-green-600 hover:bg-green-700">
              Complete Workout
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// Default export
export default ClientWorkoutView
