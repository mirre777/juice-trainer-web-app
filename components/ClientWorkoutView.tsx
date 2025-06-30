"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Clock, User, Dumbbell } from "lucide-react"
import LoadingSpinner from "@/components/shared/loading-spinner"

interface Exercise {
  id: string
  name: string
  sets: number
  reps: string
  weight?: string
  notes?: string
}

interface Workout {
  id: string
  title: string
  date: string
  duration?: number
  exercises: Exercise[]
  status: "pending" | "completed" | "skipped"
  clientName: string
  clientAvatar?: string
}

interface ClientWorkoutViewProps {
  workoutId?: string
  clientId?: string
}

export default function ClientWorkoutView({ workoutId, clientId }: ClientWorkoutViewProps) {
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
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
          clientName: "John Doe",
          clientAvatar: "/lemon-avatar.png",
          status: "pending",
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
              weight: "65 lbs",
            },
          ],
        }

        setWorkout(mockWorkout)
      } catch (err) {
        setError("Failed to load workout")
        console.error("Error loading workout:", err)
      } finally {
        setLoading(false)
      }
    }

    loadWorkout()
  }, [workoutId, clientId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
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
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "skipped":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
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
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{workout.title}</CardTitle>
                <p className="text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {workout.clientName}
                </p>
              </div>
            </div>
            <Badge className={getStatusColor(workout.status)}>
              {workout.status.charAt(0).toUpperCase() + workout.status.slice(1)}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(workout.date).toLocaleDateString()}
            </div>
            {workout.duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {workout.duration} min
              </div>
            )}
            <div className="flex items-center gap-1">
              <Dumbbell className="h-4 w-4" />
              {workout.exercises.length} exercises
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Exercises */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Exercises</h2>
        {workout.exercises.map((exercise, index) => (
          <Card key={exercise.id}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-lg">
                    {index + 1}. {exercise.name}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span>{exercise.sets} sets</span>
                    <span>{exercise.reps} reps</span>
                    {exercise.weight && <span>{exercise.weight}</span>}
                  </div>
                  {exercise.notes && (
                    <p className="mt-2 text-sm text-muted-foreground italic">Note: {exercise.notes}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      {workout.status === "pending" && (
        <div className="flex gap-2 justify-end">
          <Button variant="outline">Skip Workout</Button>
          <Button>Mark Complete</Button>
        </div>
      )}
    </div>
  )
}
