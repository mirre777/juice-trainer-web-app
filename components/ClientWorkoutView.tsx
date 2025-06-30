"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Clock, User, CheckCircle } from "lucide-react"

interface Exercise {
  id: string
  name: string
  sets: number
  reps: string
  weight?: string
  notes?: string
  completed?: boolean
}

interface Workout {
  id: string
  title: string
  date: string
  duration?: string
  exercises: Exercise[]
  clientName: string
  clientAvatar?: string
  status: "pending" | "in-progress" | "completed"
}

interface ClientWorkoutViewProps {
  workout?: Workout
  onExerciseComplete?: (exerciseId: string) => void
  onWorkoutComplete?: () => void
}

export function ClientWorkoutView({ workout, onExerciseComplete, onWorkoutComplete }: ClientWorkoutViewProps) {
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set())

  // Default workout data if none provided
  const defaultWorkout: Workout = {
    id: "1",
    title: "Upper Body Strength",
    date: new Date().toISOString().split("T")[0],
    duration: "45 min",
    clientName: "John Doe",
    clientAvatar: "/lemon-avatar.png",
    status: "in-progress",
    exercises: [
      {
        id: "1",
        name: "Bench Press",
        sets: 3,
        reps: "8-10",
        weight: "185 lbs",
        notes: "Focus on controlled movement",
      },
      {
        id: "2",
        name: "Pull-ups",
        sets: 3,
        reps: "6-8",
        notes: "Use assistance if needed",
      },
      {
        id: "3",
        name: "Shoulder Press",
        sets: 3,
        reps: "10-12",
        weight: "135 lbs",
      },
    ],
  }

  const currentWorkout = workout || defaultWorkout

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

  const allExercisesCompleted = currentWorkout.exercises.every((exercise) => completedExercises.has(exercise.id))

  const completionPercentage = Math.round((completedExercises.size / currentWorkout.exercises.length) * 100)

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={currentWorkout.clientAvatar || "/placeholder.svg"} alt={currentWorkout.clientName} />
                <AvatarFallback>
                  {currentWorkout.clientName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{currentWorkout.title}</CardTitle>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>{currentWorkout.clientName}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(currentWorkout.date).toLocaleDateString()}</span>
                  </div>
                  {currentWorkout.duration && (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{currentWorkout.duration}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge
                variant={
                  currentWorkout.status === "completed"
                    ? "default"
                    : currentWorkout.status === "in-progress"
                      ? "secondary"
                      : "outline"
                }
              >
                {currentWorkout.status.replace("-", " ")}
              </Badge>
              <div className="text-sm text-gray-600 mt-1">{completionPercentage}% Complete</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-green-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        {currentWorkout.exercises.map((exercise, index) => (
          <Card
            key={exercise.id}
            className={`transition-all duration-200 ${
              completedExercises.has(exercise.id) ? "bg-green-50 border-green-200" : ""
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-medium text-gray-500">{index + 1}.</span>
                    <h3
                      className={`text-lg font-semibold ${
                        completedExercises.has(exercise.id) ? "line-through text-gray-500" : ""
                      }`}
                    >
                      {exercise.name}
                    </h3>
                    {completedExercises.has(exercise.id) && <CheckCircle className="w-5 h-5 text-green-600" />}
                  </div>

                  <div className="mt-2 flex items-center space-x-6 text-sm text-gray-600">
                    <span>
                      <strong>Sets:</strong> {exercise.sets}
                    </span>
                    <span>
                      <strong>Reps:</strong> {exercise.reps}
                    </span>
                    {exercise.weight && (
                      <span>
                        <strong>Weight:</strong> {exercise.weight}
                      </span>
                    )}
                  </div>

                  {exercise.notes && (
                    <div className="mt-2 text-sm text-gray-600">
                      <strong>Notes:</strong> {exercise.notes}
                    </div>
                  )}
                </div>

                <Button
                  variant={completedExercises.has(exercise.id) ? "outline" : "default"}
                  onClick={() => handleExerciseToggle(exercise.id)}
                  className="ml-4"
                >
                  {completedExercises.has(exercise.id) ? "Undo" : "Complete"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Complete Workout Button */}
      {allExercisesCompleted && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Great job! All exercises completed!</h3>
            <Button onClick={onWorkoutComplete} className="bg-green-600 hover:bg-green-700">
              Complete Workout
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ClientWorkoutView
