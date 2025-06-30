export interface WorkoutProgram {
  program_URL?: string
  program_title: string
  program_notes?: string | null
  program_weeks: number
  routine_count: number
  routines: WorkoutRoutine[]
  is_periodized?: boolean // New field to indicate if program changes week by week
  weeks?: ExerciseWeek[] // Added weeks to WorkoutProgram for periodized programs
}

export interface WorkoutRoutine {
  routine_name: string
  routine_rank: string
  exercises: ProgramExercise[]
  // For periodized programs, exercises can have different values per week
}

export interface ProgramExercise {
  name: string
  exercise_category: string
  exercise_video?: string | null
  notes?: string | null // Changed from 'exercise_notes' to 'notes'
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
          name: "Bench Press",
          exercise_category: "Push",
          notes: "Focus on progressive overload", // Changed from 'exercise_notes' to 'notes'
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
  ],
}

// Helper function to validate program structure for mobile conversion
export function validateProgramForMobileConversion(program: WorkoutProgram): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!program.program_title?.trim()) {
    errors.push("Program title is required")
  }

  if (!program.program_weeks || program.program_weeks < 1) {
    errors.push("Program must have at least 1 week")
  }

  if (program.is_periodized) {
    if (!program.weeks || program.weeks.length === 0) {
      errors.push("Periodized program must have weeks data")
    }

    if (program.weeks && program.weeks.length !== program.program_weeks) {
      errors.push("Number of weeks in data doesn't match program_weeks")
    }
  } else {
    if (!program.weeks || program.weeks.length === 0) {
      if (!program.routines || program.routines.length === 0) {
        errors.push("Non-periodized program must have routines")
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// Helper function to estimate mobile app data size
export function estimateMobileDataSize(program: WorkoutProgram): {
  routineCount: number
  exerciseCount: number
  setCount: number
} {
  let routineCount = 0
  let exerciseCount = 0
  let setCount = 0

  if (program.is_periodized && program.weeks) {
    for (const week of program.weeks) {
      if (week.routines) {
        routineCount += week.routines.length
        for (const routine of week.routines) {
          if (routine.exercises) {
            exerciseCount += routine.exercises.length
            for (const exercise of routine.exercises) {
              const weekData = exercise.weeks?.find((w) => w.week_number === week.week_number)
              if (weekData?.sets) {
                setCount += weekData.sets.length
              }
            }
          }
        }
      }
    }
  } else {
    // Non-periodized: multiply by number of weeks
    const singleWeek = program.weeks?.[0] || { routines: program.routines || [] }
    const weekRoutineCount = singleWeek.routines?.length || 0
    let weekExerciseCount = 0
    let weekSetCount = 0

    if (singleWeek.routines) {
      for (const routine of singleWeek.routines) {
        if (routine.exercises) {
          weekExerciseCount += routine.exercises.length
          for (const exercise of routine.exercises) {
            const firstWeekData = exercise.weeks?.[0]
            if (firstWeekData?.sets) {
              weekSetCount += firstWeekData.sets.length
            }
          }
        }
      }
    }

    routineCount = weekRoutineCount * program.program_weeks
    exerciseCount = weekExerciseCount * program.program_weeks
    setCount = weekSetCount * program.program_weeks
  }

  return { routineCount, exerciseCount, setCount }
}
