import { WorkoutExercise } from "@/lib/firebase/workouts/types"

type GlobalProgram = {
  id: string
  name: string
  description: string
  notes: string
  isOnboarding: boolean
  routines: GlobalProgramRoutine[]
  createdAt: string
  updatedAt: string
}

type GlobalProgramRoutine = {
  routineId: string
  order: number
  week: number
}

type GlobalRoutine = {
  id: string
  name: string
  notes: string
  description: string
  exercises: WorkoutExercise[]
}

type RoutineWithOrder = Omit<GlobalRoutine, "routineId"> & GlobalProgramRoutine

type ProgramWithRoutines = GlobalProgram & {
  routines: RoutineWithOrder[]
}

export type { GlobalProgram, GlobalProgramRoutine, GlobalRoutine, ProgramWithRoutines, RoutineWithOrder }