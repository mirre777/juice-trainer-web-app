export interface WorkoutProgram {
  id?: string
  title: string
  notes?: string
  weeks: ProgramWeek[]
  duration?: number
  program_URL?: string
}

export interface ProgramWeek {
  week_number: number
  routines: ProgramRoutine[]
}

export interface ProgramRoutine {
  name: string
  notes?: string
  order?: number
  exercises: ProgramExercise[]
}

export interface ProgramExercise {
  id?: string
  name: string
  video_url?: string
  notes?: string
  sets: ProgramSet[]
}

export interface ProgramSet {
  id?: string
  reps: string
  weight?: string
  type?: string
  set_type?: string
  rpe?: string
  rest?: string
  notes?: string
}

export const DEFAULT_EXERCISE_CATEGORIES = [
  "Chest",
  "Back",
  "Shoulders",
  "Arms",
  "Legs",
  "Core",
  "Cardio",
  "Full Body",
  "Mobility",
  "Other",
] as const

export type ExerciseCategory = (typeof DEFAULT_EXERCISE_CATEGORIES)[number]

export interface MobileProgram {
  id: string
  name: string
  notes: string | null
  startedAt: string
  duration: number
  createdAt: string
  updated_at: string
  routines: Array<{
    routineId: string
    week: number
    order: number
  }>
}

export interface MobileRoutine {
  id: string
  name: string
  notes: string
  createdAt: string
  updatedAt: string
  deletedAt: null
  type: "program"
  exercises: Array<{
    id: string
    name: string
    sets: Array<{
      id: string
      type: string
      weight: string
      reps: string
      notes?: string
    }>
  }>
}

export interface MobileExercise {
  id: string
  name: string
  muscleGroup?: string
  isCardio?: boolean
  isFullBody?: boolean
  isMobility?: boolean
  createdAt: any
  updatedAt: any
  deletedAt: null
}

export function validateProgramForMobileConversion(program: WorkoutProgram): boolean {
  if (!program.title || !program.weeks || program.weeks.length === 0) {
    return false
  }

  for (const week of program.weeks) {
    if (!week.routines || week.routines.length === 0) {
      return false
    }

    for (const routine of week.routines) {
      if (!routine.name || !routine.exercises || routine.exercises.length === 0) {
        return false
      }

      for (const exercise of routine.exercises) {
        if (!exercise.name || !exercise.sets || exercise.sets.length === 0) {
          return false
        }
      }
    }
  }

  return true
}

export function estimateProgramDataSize(program: WorkoutProgram): number {
  return JSON.stringify(program).length
}

export function getProgramStats(program: WorkoutProgram) {
  const totalWeeks = program.weeks.length
  const totalRoutines = program.weeks.reduce((acc, week) => acc + week.routines.length, 0)
  const totalExercises = program.weeks.reduce(
    (acc, week) => acc + week.routines.reduce((routineAcc, routine) => routineAcc + routine.exercises.length, 0),
    0,
  )
  const uniqueExercises = new Set(
    program.weeks.flatMap((week) => week.routines.flatMap((routine) => routine.exercises.map((ex) => ex.name))),
  ).size

  return {
    totalWeeks,
    totalRoutines,
    totalExercises,
    uniqueExercises,
  }
}
