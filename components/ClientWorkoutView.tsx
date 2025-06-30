"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, Target, CheckCircle, Play, Pause, RotateCcw, Heart, MessageCircle, Share2 } from "lucide-react"

interface Exercise {
  id: string
  name: string
  sets: number
  reps: string
  weight?: string
  duration?: string
  restTime: string
  completed: boolean
  notes?: string
}

interface WorkoutData {
  id: string
  title: string
  date: string
  duration: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  category: string
  exercises: Exercise[]
  clientName: string
  clientAvatar: string
  trainerNotes?: string
  status: "pending" | "in-progress" | "completed"
}

const mockWorkout: WorkoutData = {
  id: "workout_1",
  title: "Upper Body Strength Training",
  date: "2024-01-15",
  duration: "45 min",
  difficulty: "Intermediate",
  category: "Strength Training",
  clientName: "Sarah Johnson",
  clientAvatar: "/lemon-avatar.png",
  trainerNotes: "Focus on form over weight. Take your time with each rep.",
  status: "in-progress",
  exercises: [
    {
      id: "ex_1",
      name: "Push-ups",
      sets: 3,
      reps: "12-15",
      restTime: "60s",
      completed: true,
      notes: "Keep core tight",
    },
    {
      id: "ex_2",
      name: "Dumbbell Rows",
      sets: 3,
      reps: "10-12",
      weight: "15 lbs",
      restTime: "90s",
      completed: true,
    },
    {
      id: "ex_3",
      name: "Shoulder Press",
      sets: 3,
      reps: "8-10",
      weight: "12 lbs",
      restTime: "90s",
      completed: false,
    },
    {
      id: "ex_4",
      name: "Plank",
      sets: 3,
      reps: "1",
      duration: "30s",
      restTime: "60s",
      completed: false,
    },
  ],
}

export function ClientWorkoutView() {
  const [workout, setWorkout] = useState<WorkoutData>(mockWorkout)
  const [currentExercise, setCurrentExercise] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)

  const completedExercises = workout.exercises.filter((ex) => ex.completed).length
  const progressPercentage = (completedExercises / workout.exercises.length) * 100

  const toggleExerciseComplete = (exerciseId: string) => {
    setWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => (ex.id === exerciseId ? { ...ex, completed: !ex.completed } : ex)),
    }))
  }

  const startTimer = () => {
    setIsTimerRunning(true)
    // In a real app, you'd implement actual timer logic here
  }

  const pauseTimer = () => {
    setIsTimerRunning(false)
  }

  const resetTimer = () => {
    setIsTimerRunning(false)
    setTimerSeconds(0)
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={workout.clientAvatar || "/placeholder.svg"} alt={workout.clientName} />
                <AvatarFallback>
                  {workout.clientName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{workout.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {workout.clientName} • {workout.date}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{workout.difficulty}</Badge>
              <Badge variant="outline">{workout.category}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{workout.duration}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{workout.exercises.length} exercises</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{completedExercises} completed</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {workout.trainerNotes && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Trainer Notes:</strong> {workout.trainerNotes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rest Timer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rest Timer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-mono">
              {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, "0")}
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant={isTimerRunning ? "secondary" : "default"}
                onClick={isTimerRunning ? pauseTimer : startTimer}
              >
                {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="outline" onClick={resetTimer}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercises */}
      <div className="space-y-4">
        {workout.exercises.map((exercise, index) => (
          <Card key={exercise.id} className={exercise.completed ? "bg-green-50 border-green-200" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-muted-foreground">{index + 1}.</span>
                      <h3 className="font-semibold">{exercise.name}</h3>
                      {exercise.completed && <CheckCircle className="h-4 w-4 text-green-600" />}
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Sets:</span>
                      <span className="ml-1 font-medium">{exercise.sets}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reps:</span>
                      <span className="ml-1 font-medium">{exercise.reps}</span>
                    </div>
                    {exercise.weight && (
                      <div>
                        <span className="text-muted-foreground">Weight:</span>
                        <span className="ml-1 font-medium">{exercise.weight}</span>
                      </div>
                    )}
                    {exercise.duration && (
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="ml-1 font-medium">{exercise.duration}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Rest:</span>
                      <span className="ml-1 font-medium">{exercise.restTime}</span>
                    </div>
                  </div>

                  {exercise.notes && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      <strong>Notes:</strong> {exercise.notes}
                    </div>
                  )}
                </div>

                <Button
                  variant={exercise.completed ? "secondary" : "default"}
                  size="sm"
                  onClick={() => toggleExerciseComplete(exercise.id)}
                >
                  {exercise.completed ? "Completed" : "Mark Complete"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="outline" size="sm">
              <Heart className="h-4 w-4 mr-2" />
              Like Workout
            </Button>
            <Button variant="outline" size="sm">
              <MessageCircle className="h-4 w-4 mr-2" />
              Add Comment
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share Progress
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Named export

// Default export
export default ClientWorkoutView
