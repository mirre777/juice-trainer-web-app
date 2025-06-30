"use client"

import { useState } from "react"
import { ProgramCard } from "@/components/programs/ProgramCard"
import { AssignProgramDialog } from "@/components/programs/assign-program-dialog"
import type { WorkoutProgram } from "@/types/workout-program"

// This is a placeholder for your actual program data fetching.
// In a real application, this would come from a server component or API call.
const dummyPrograms: WorkoutProgram[] = [
  {
    id: "prog1",
    program_title: "Beginner Strength",
    program_notes: "A 4-week program for new lifters.",
    program_weeks: 4,
    is_periodized: false,
    routines: [
      {
        routine_id: "routine1",
        routine_name: "Full Body A",
        routine_rank: "1",
        notes: "Focus on compound movements.",
        exercises: [
          {
            exercise_id: "ex1",
            name: "Squat",
            exercise_category: "Legs",
            exercise_video: "https://example.com/squat.mp4",
            notes: "Go deep!",
            weeks: [{ week_number: 1, sets: [{ reps: 5, weight: 50, warmup: false, rpe: 7, rest: "90s" }] }],
          },
        ],
      },
    ],
  },
  {
    id: "prog2",
    program_title: "Advanced Hypertrophy",
    program_notes: "8 weeks of muscle building.",
    program_weeks: 8,
    is_periodized: true,
    routines: [
      {
        routine_id: "routine2",
        routine_name: "Chest & Triceps",
        routine_rank: "1",
        notes: "High volume day.",
        exercises: [
          {
            exercise_id: "ex3",
            name: "Bench Press",
            exercise_category: "Chest",
            exercise_video: "https://example.com/bench.mp4",
            notes: "Control the eccentric.",
            weeks: [
              { week_number: 1, sets: [{ reps: 8, weight: 80, warmup: false, rpe: 8, rest: "120s" }] },
              { week_number: 2, sets: [{ reps: 8, weight: 82.5, warmup: false, rpe: 8, rest: "120s" }] },
            ],
          },
        ],
      },
    ],
  },
]

export default function ProgramsPageClient() {
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedProgramForAssignment, setSelectedProgramForAssignment] = useState<WorkoutProgram | null>(null)

  const handleAssignProgramClick = (program: WorkoutProgram) => {
    setSelectedProgramForAssignment(program)
    setIsAssignDialogOpen(true)
  }

  const handleCloseAssignDialog = () => {
    setIsAssignDialogOpen(false)
    setSelectedProgramForAssignment(null)
  }

  // In a real app, `programs` would be fetched from a server component or API
  const programs = dummyPrograms.map((p) => ({
    ...p,
    createdAt: new Date(), // Dummy date for display
    clientsAssigned: Math.floor(Math.random() * 10), // Dummy client count
    status: "active", // Dummy status
  }))

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Programs</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.map((program) => (
          <ProgramCard
            key={program.id}
            program={program}
            onClick={() => console.log("Program clicked:", program.name)}
            onEdit={() => console.log("Edit program:", program.name)}
            onDelete={() => console.log("Delete program:", program.name)}
            onAssign={handleAssignProgramClick} // Pass the new handler
          />
        ))}
      </div>

      {/* Render the Assign Program Dialog */}
      <AssignProgramDialog
        isOpen={isAssignDialogOpen}
        onClose={handleCloseAssignDialog}
        program={selectedProgramForAssignment}
      />
    </main>
  )
}
