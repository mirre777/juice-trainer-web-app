"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Eye, MessageSquare } from "lucide-react"
import Image from "next/image"

interface Exercise {
  name: string
  sets: string
  reps: string
  weight: string
  completed: boolean
  notes?: string
}

interface WorkoutData {
  clientName: string
  date: string
  workoutName: string
  programWeek: string
  dayOfWeek: string
  exercises: Exercise[]
  clientNote?: string
  personalRecords?: Array<{
    exercise: string
    weight: string
    reps: string
  }>
}

interface ClientWorkoutViewProps {
  workoutData?: WorkoutData
  className?: string
}

export function ClientWorkoutView({
  workoutData = {
    clientName: "Michael Thompson",
    date: "Unknown Date",
    workoutName: "Lower Body",
    programWeek: "Program week 3/8",
    dayOfWeek: "Days 3/4",
    exercises: [
      { name: "Back Squat", sets: "5", reps: "5", weight: "120 kg", completed: true },
      { name: "Romanian DL", sets: "3", reps: "8", weight: "Not Completed", completed: false },
      { name: "Leg Press", sets: "3", reps: "10", weight: "200 kg", completed: true },
      { name: "Leg Extension", sets: "3", reps: "12", weight: "70 kg", completed: true },
    ],
    clientNote:
      "Felt strong today but had some tightness in my right hamstring during Romanian deadlifts. Reduced the weight slightly for the last two sets.",
    personalRecords: [{ exercise: "Back Squat", weight: "120 kg", reps: "5 reps" }],
  },
  className = "",
}: ClientWorkoutViewProps) {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)

  const completedExercises = workoutData.exercises.filter((ex) => ex.completed).length
  const totalExercises = workoutData.exercises.length
  const completionPercentage = Math.round((completedExercises / totalExercises) * 100)

  const getExerciseStatus = (exercise: Exercise) => {
    if (exercise.completed) {
      return { color: "bg-green-100 text-green-800", text: "Completed" }
    } else {
      return { color: "bg-orange-100 text-orange-800", text: "Not Completed" }
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Client Header */}
      <div className="flex items-center space-x-4">
        <div className="relative w-12 h-12">
          <Image
            src="/lemon-avatar.png"
            alt={workoutData.clientName}
            width={48}
            height={48}
            className="rounded-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              const target = e.target as HTMLImageElement
              target.style.display = "none"
              const fallback = target.nextElementSibling as HTMLElement
              if (fallback) fallback.style.display = "flex"
            }}
          />
          <div
            className="absolute inset-0 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium text-sm"
            style={{ display: "none" }}
          >
            {workoutData.clientName
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">{workoutData.clientName}</h2>
          <p className="text-sm text-gray-500">{workoutData.date}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">{workoutData.programWeek}</div>
          <div className="text-sm text-gray-500">{workoutData.dayOfWeek}</div>
        </div>
      </div>

      {/* Workout Progress */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2 text-green-600">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm font-medium">HAPPENING NOW</span>
        </div>
      </div>

      {/* Workout Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{workoutData.workoutName}</h1>
        <Progress value={completionPercentage} className="h-2" />
        <p className="text-sm text-gray-500 mt-1">
          {completedExercises}/{totalExercises} exercises completed
        </p>
      </div>

      {/* Client Note */}
      {workoutData.clientNote && (
        <Card className="border-l-4 border-l-yellow-400">
          <CardContent className="p-4">
            <div className="flex items-start space-x-2">
              <MessageSquare className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">Client Note:</p>
                <p className="text-sm text-gray-700">{workoutData.clientNote}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exercise Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workoutData.exercises.map((exercise, index) => {
          const status = getExerciseStatus(exercise)
          return (
            <Card
              key={index}
              className={`cursor-pointer transition-all hover:shadow-md ${
                exercise.completed ? "border-green-200" : "border-orange-200"
              }`}
              onClick={() => setSelectedExercise(exercise)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{exercise.name}</h3>
                  <Badge className={status.color}>{status.text}</Badge>
                </div>
                <div className="text-sm text-gray-600">
                  {exercise.weight} • {exercise.sets} sets • {exercise.reps} reps
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Selected Exercise Details */}
      {selectedExercise && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{selectedExercise.name}</h3>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View history
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Highest</p>
                <p className="text-lg font-bold">
                  {selectedExercise.weight} • {selectedExercise.reps} reps
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Sets</p>
                <div className="space-y-2">
                  {Array.from({ length: Number.parseInt(selectedExercise.sets) }, (_, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{i + 1}</span>
                      <span className="text-sm">
                        {selectedExercise.weight} • {selectedExercise.reps} reps
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personal Records */}
      {workoutData.personalRecords && workoutData.personalRecords.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-4">Recent Personal Records</h3>
            <div className="space-y-2">
              {workoutData.personalRecords.map((pr, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="font-medium text-green-800">{pr.exercise}</span>
                  <span className="text-green-700">
                    {pr.weight} • {pr.reps}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Personal records will appear here as clients achieve new milestones
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Add this at the end of the file
export default ClientWorkoutView
