import { WorkoutExercise } from "@/lib/firebase/workout-exercise-service"

type Program = {
  id: string
  name: string
  description: string
  status: string
  notes: string
  routines: ProgramRoutine[]
  createdAt: string
  updatedAt: string
  isPeriodize: boolean
}

type ProgramRoutine = {
  routineId: string
  exercises: WorkoutExercise[]
  name: string
  notes: string
  order: number
  week: number
}

type ImportProgram = {
  id: string
  name: string
  status: string
  program: Program
  createdAt: string
}


export type { ImportProgram, Program }