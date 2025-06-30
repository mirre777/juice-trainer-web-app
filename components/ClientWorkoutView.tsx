"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TrendingUp } from "lucide-react"

export function ClientWorkoutView() {
  const workoutData = {
    client: {
      name: "Michael Thompson",
      avatar: "/lemon-avatar.png",
      initials: "MT",
    },
    program: {
      week: 3,
      totalWeeks: 8,
      day: 3,
      totalDays: 4,
    },
    workout: {
      name: "Lower Body",
      status: "HAPPENING NOW",
      date: "Unknown Date",
    },
    exercises: [
      {
        name: "Back Squat",
        weight: "120 kg",
        reps: "5",
        status: "completed",
        sets: [
          { weight: "120 kg", reps: "5 reps" },
          { weight: "120 kg", reps: "5 reps" },
          { weight: "120 kg", reps: "5 reps" },
        ],
      },
      {
        name: "Romanian DL",
        status: "not-completed",
        note: "Not Completed",
      },
      {
        name: "Leg Press",
        weight: "200 kg",
        reps: "10",
        status: "completed",
      },
      {
        name: "Leg Extension",
        weight: "70 kg",
        reps: "12",
        status: "completed",
      },
    ],
    clientNote:
      "Felt strong today but had some tightness in my right hamstring during Romanian deadlifts. Reduced the weight slightly for the last two sets.",
    personalRecords: {
      exercise: "Back Squat",
      record: "120 kg • 5 reps",
    },
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={workoutData.client.avatar || "/placeholder.svg"} alt={workoutData.client.name} />
            <AvatarFallback className="bg-yellow-100 text-yellow-800">{workoutData.client.initials}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold">{workoutData.client.name}</h2>
            <p className="text-gray-500">{workoutData.workout.date}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">
            Program week {workoutData.program.week}/{workoutData.program.totalWeeks}
          </div>
          <div className="text-sm text-gray-500">
            Days {workoutData.program.day}/{workoutData.program.totalDays}
          </div>
        </div>
      </div>

      {/* Week Progress */}
      <div className="flex justify-center space-x-2">
        {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
          <div
            key={index}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
              index < workoutData.program.day ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Workout Status */}
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-green-600 font-medium text-sm">{workoutData.workout.status}</span>
      </div>

      {/* Workout Title */}
      <h1 className="text-2xl font-bold">{workoutData.workout.name}</h1>

      {/* Client Note */}
      <Card className="border-l-4 border-l-yellow-400">
        <CardContent className="p-4">
          <h3 className="font-medium text-sm text-gray-700 mb-2">Client Note:</h3>
          <p className="text-sm text-gray-600">{workoutData.clientNote}</p>
        </CardContent>
      </Card>

      {/* Exercises */}
      <div className="grid grid-cols-2 gap-4">
        {workoutData.exercises.map((exercise, index) => (
          <Card
            key={index}
            className={`${
              exercise.status === "completed"
                ? "border-green-200 bg-green-50"
                : exercise.status === "not-completed"
                  ? "border-yellow-200 bg-yellow-50"
                  : "border-gray-200"
            }`}
          >
            <CardContent className="p-4">
              <h3 className="font-medium">{exercise.name}</h3>
              {exercise.weight && exercise.reps ? (
                <p className="text-sm text-gray-600">
                  {exercise.weight} • {exercise.reps}
                </p>
              ) : exercise.note ? (
                <p className="text-sm text-yellow-600">{exercise.note}</p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Exercise Detail */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{workoutData.exercises[0].name}</h3>
            <Button variant="link" className="text-sm text-blue-600">
              View history
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Highest</p>
            <p className="font-semibold">{workoutData.personalRecords.record}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-2">Sets</p>
            <div className="space-y-2">
              {workoutData.exercises[0].sets?.map((set, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="w-6">{index + 1}</span>
                  <span>
                    {set.weight} • {set.reps}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Records */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Recent Personal Records</h3>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No personal records available yet</p>
            <p className="text-sm text-gray-400">Personal records will appear here as clients achieve new milestones</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
