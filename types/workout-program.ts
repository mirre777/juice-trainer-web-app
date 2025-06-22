export interface WorkoutProgram {
  program_URL?: string
  program_title: string
  program_notes?: string | null
  program_weeks: number
  routine_count: number
  routines: WorkoutRoutine[]
  is_periodized?: boolean // New field to indicate if program changes week by week
}

export interface WorkoutRoutine {
  routine_name: string
  routine_rank: string
  exercises: ProgramExercise[]
  // For periodized programs, exercises can have different values per week
}

export interface ProgramExercise {
  name: string // Changed from 'exercise' to 'name'
  exercise_category: string
  exercise_video?: string | null
  exercise_notes?: string | null
  weeks: ExerciseWeek[]
  // For non-periodized: weeks array has same values repeated
  // For periodized: weeks array has different values per week
}

export interface ExerciseWeek {
  week_number: number
  set_count: number
  sets: WorkoutSet[]
  routines?: WorkoutRoutine[] // Added routines to ExerciseWeek for periodized programs
}

export interface WorkoutSet {
  set_number: number
  warmup: boolean
  reps: number | string | null
  duration_sec?: number | string | null
  weight?: number | string | null
  rpe: number | string | null
  rest: string | null
  notes: string | null
}

// Helper types for the UI
export interface ExerciseCategory {
  name: string
  exercises: string[]
}

export const DEFAULT_EXERCISE_CATEGORIES: ExerciseCategory[] = [
  {
    name: "Upper Body",
    exercises: ["Bench Press", "Push-ups", "Pull-ups", "Shoulder Press", "Bicep Curls", "Tricep Extensions"],
  },
  {
    name: "Lower Body",
    exercises: ["Squats", "Deadlifts", "Lunges", "Leg Press", "Calf Raises", "Leg Extensions"],
  },
  {
    name: "Core",
    exercises: ["Crunches", "Planks", "Russian Twists", "Leg Raises", "Mountain Climbers", "Ab Rollouts"],
  },
  {
    name: "Cardio",
    exercises: ["Running", "Cycling", "Jumping Jacks", "Burpees", "Jump Rope", "High Knees"],
  },
]

export type ExerciseSet = WorkoutSet

// Sample periodized program data structure
export const SAMPLE_PERIODIZED_PROGRAM: WorkoutProgram = {
  program_title: "12-Week Strength Periodization",
  program_notes: "Progressive overload with deload weeks",
  program_weeks: 12,
  routine_count: 2,
  is_periodized: true,
  routines: [
    {
      routine_name: "Upper Body",
      routine_rank: "1",
      exercises: [
        {
          name: "Bench Press", // Changed from 'exercise' to 'name'
          exercise_category: "Push",
          exercise_notes: "Focus on progressive overload",
          weeks: [
            // Week 1-3: Volume Phase
            {
              week_number: 1,
              set_count: 4,
              sets: [
                { set_number: 1, warmup: true, reps: "8", rpe: "6", rest: "90s", notes: null },
                { set_number: 2, warmup: false, reps: "8", rpe: "7", rest: "90s", notes: null },
                { set_number: 3, warmup: false, reps: "8", rpe: "7", rest: "90s", notes: null },
                { set_number: 4, warmup: false, reps: "8", rpe: "8", rest: "90s", notes: null },
              ],
            },
            {
              week_number: 2,
              set_count: 4,
              sets: [
                { set_number: 1, warmup: true, reps: "8", rpe: "6", rest: "90s", notes: null },
                { set_number: 2, warmup: false, reps: "8", rpe: "7.5", rest: "90s", notes: null },
                { set_number: 3, warmup: false, reps: "8", rpe: "7.5", rest: "90s", notes: null },
                { set_number: 4, warmup: false, reps: "8", rpe: "8.5", rest: "90s", notes: null },
              ],
            },
            {
              week_number: 3,
              set_count: 4,
              sets: [
                { set_number: 1, warmup: true, reps: "8", rpe: "6", rest: "90s", notes: null },
                { set_number: 2, warmup: false, reps: "8", rpe: "8", rest: "90s", notes: null },
                { set_number: 3, warmup: false, reps: "8", rpe: "8", rest: "90s", notes: null },
                { set_number: 4, warmup: false, reps: "8", rpe: "9", rest: "90s", notes: null },
              ],
            },
            // Week 4: Deload
            {
              week_number: 4,
              set_count: 3,
              sets: [
                { set_number: 1, warmup: true, reps: "8", rpe: "5", rest: "60s", notes: "Deload week" },
                { set_number: 2, warmup: false, reps: "8", rpe: "6", rest: "60s", notes: null },
                { set_number: 3, warmup: false, reps: "8", rpe: "6", rest: "60s", notes: null },
              ],
            },
            // Week 5-7: Intensity Phase
            {
              week_number: 5,
              set_count: 5,
              sets: [
                { set_number: 1, warmup: true, reps: "5", rpe: "6", rest: "120s", notes: null },
                { set_number: 2, warmup: false, reps: "5", rpe: "7", rest: "120s", notes: null },
                { set_number: 3, warmup: false, reps: "5", rpe: "7", rest: "120s", notes: null },
                { set_number: 4, warmup: false, reps: "5", rpe: "8", rest: "120s", notes: null },
                { set_number: 5, warmup: false, reps: "5", rpe: "8", rest: "120s", notes: null },
              ],
            },
            // ... continue for remaining weeks
          ],
        },
      ],
    },
  ],
}
