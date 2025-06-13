"use client"

import { SharedWorkoutCard } from "@/components/shared-workout-card"

export default function WorkoutsPage() {
  const handleRespond = (id: string) => {
    console.log(`Responding to workout ${id}`)
  }

  const handleClose = (id: string) => {
    console.log(`Closing workout ${id}`)
  }

  // This page already has mock data
  const demoWorkouts = [
    {
      id: "1",
      day: "3",
      focus: "Lower body",
      clientName: "Lisa Martinez",
      progress: {
        completed: 2,
        total: 5,
      },
      exercises: [
        {
          name: "Bench Press",
          target: "85 kg",
          sets: 4,
          reps: 8,
        },
        {
          name: "Squats",
          target: "100 kg",
          sets: 3,
          reps: 12,
        },
        {
          name: "Deadlift",
          target: "120 kg",
          sets: 3,
          reps: 10,
        },
      ],
    },
    {
      id: "2",
      day: "4",
      focus: "Upper body",
      clientName: "John Smith",
      progress: {
        completed: 3,
        total: 5,
      },
      exercises: [
        {
          name: "Pull-ups",
          target: "15 reps",
          sets: 3,
          reps: 15,
        },
        {
          name: "Shoulder Press",
          target: "60 kg",
          sets: 4,
          reps: 10,
        },
        {
          name: "Bicep Curls",
          target: "20 kg",
          sets: 3,
          reps: 12,
        },
      ],
    },
  ]

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Shared Workouts</h1>
      <SharedWorkoutCard workouts={demoWorkouts} onRespond={handleRespond} onClose={handleClose} />
    </div>
  )
}
