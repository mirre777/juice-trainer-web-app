"use client"

import { ClientWorkoutView } from "@/components/client-workout-view"

export default function ClientWorkoutExamplePage() {
  // Example data
  const exercises = [
    {
      id: "bench-press",
      name: "Bench Press",
      weight: "80 kg",
      reps: "8",
      completed: true,
      sets: [
        { number: 1, weight: "80 kg", reps: "8" },
        { number: 2, weight: "75 kg", reps: "10" },
        { number: 3, weight: "75 kg", reps: "8" },
      ],
    },
    {
      id: "incline-press",
      name: "Incline Press",
      weight: "60 kg",
      reps: "10",
      completed: true,
      sets: [
        { number: 1, weight: "60 kg", reps: "10" },
        { number: 2, weight: "60 kg", reps: "8" },
        { number: 3, weight: "55 kg", reps: "10" },
      ],
    },
    {
      id: "cable-fly",
      name: "Cable Fly",
      weight: "15 kg",
      reps: "12",
      completed: true,
      sets: [
        { number: 1, weight: "15 kg", reps: "12", isPR: true },
        { number: 2, weight: "15 kg", reps: "10" },
        { number: 3, weight: "12.5 kg", reps: "12" },
      ],
    },
  ]

  // Personal records data
  const personalRecords = [
    {
      exercise: "Bench Press",
      weight: "85 kg",
      reps: "5",
      date: "April 18, 2025",
      isPR: true,
    },
    {
      exercise: "Deadlift",
      weight: "180 kg",
      reps: "3",
      date: "April 11, 2025",
      isPR: true,
    },
  ]

  return (
    <div className="w-full min-h-screen bg-gray-100 flex justify-center py-8">
      <div className="w-full max-w-[800px] flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Client Workout Example</h1>
        <p className="text-gray-600">This is an example of using the ClientWorkoutView component in another context.</p>

        <ClientWorkoutView
          client={{
            id: "sarah-johnson",
            name: "Sarah Johnson",
            date: "April 30, 2025",
            programWeek: "2",
            programTotal: "12",
            daysCompleted: "2",
            daysTotal: "5",
          }}
          workout={{
            day: "3",
            focus: "Upper Body",
            clientNote: "Feeling good today! Increased weight on bench press by 2.5kg from last session.",
          }}
          exercises={exercises}
          personalRecords={personalRecords}
          onEmojiSelect={(emoji) => console.log("Emoji selected:", emoji)}
          onComment={(comment) => console.log("Comment submitted:", comment)}
        />
      </div>
    </div>
  )
}
