import { collection, doc, getDocs, serverTimestamp, setDoc } from "firebase/firestore"
import { ProgramWithRoutines, RoutineWithOrder } from "../global-programs/types"
import { WorkoutExercise } from "../workout-exercise-service"
import { db } from "@/lib/db"

type SimpleExercise = {
  id: string
  name: string
}

export async function importProgram(program: ProgramWithRoutines, userId: string) {
  console.log("importing program", program.id, "for user", userId)
  const allExercises = await getAllExercises(userId)
  // import routines sequentially and wait for the response
  const routines = await program?.routines.map(async (routine: RoutineWithOrder) => {
    await importRoutine(userId, routine, program.id, allExercises)
    return {
      routineId: routine.id,
      week: routine.week,
      order: routine.order
    }
  })

  const newProgram = {
    id: program.id,
    name: program.name,
    notes: program.notes ?? "",
    routines: routines,
    isGlobal: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deletedAt: null,
  }
  console.log("saving program", newProgram)
  const programRef = doc(db, "users", userId, "programs", program.id)
  await setDoc(programRef, newProgram)
}

export async function importRoutine(userId: string, routine: RoutineWithOrder, programId: string, allExercises: SimpleExercise[]): Promise<string> {
  const exercises = await Promise.all(routine.exercises.map(async (exercise) => {
    const exerciseId = await getOrCreateExercise(userId, exercise, allExercises)
    return {
        ...exercise,
        id: exerciseId
    }
  }))
  const newRoutine = {
    id: routine.id,
    name: routine.name,
    notes: routine.notes,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deletedAt: null,
    type: "program",
    programId,
    exercises
  }
  const routineRef = doc(db, "users", userId, "routines", routine.id)
  await setDoc(routineRef, newRoutine)
  console.log("routine", routine)
  return routine.id
}

async function getOrCreateExercise(userId: string, exercise: WorkoutExercise, allExercises: SimpleExercise[]): Promise<string> {
    // compare exercise.name to allExercises without case insensitive
    console.log("searching for exercise", exercise.name)
    const existingExercise = allExercises.find((e) => e.name.toLowerCase() === exercise.name.toLowerCase())

    if (existingExercise) {
        console.log("found existingExercise", existingExercise)
        return existingExercise.id
    }
    const newExercise = await createExercise(userId, exercise)
    return newExercise.id
}

async function createExercise(userId: string, exercise: WorkoutExercise): Promise<SimpleExercise> {
    const exerciseRef = doc(db, "users", userId, "exercises", exercise.id)
    const now = serverTimestamp()
    const newExercise = {
        id: exercise.id,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup ?? "Other",
        isCardio: false,
        isFullBody: false,
        isMobility: false,
        createdAt: now,
        updatedAt: now,
        deletedAt: null
    }
    await setDoc(exerciseRef, newExercise)
    return newExercise
}

async function getAllExercises(userId: string): Promise<SimpleExercise[]> {
    const globalExercises = await getGlobalExercises()
    const userExercises = await getUserExercises(userId)
    return [...globalExercises, ...userExercises]
}


async function getGlobalExercises() {
    const exercises = await getDocs(collection(db, "exercises"))
    return exercises.docs.map((doc) => {
        return {
            id: doc.id,
            name: doc.data().name
        }
    })
}

async function getUserExercises(userId: string) {
    const exercises = await getDocs(collection(db, "users", userId, "exercises"))
    return exercises.docs.map((doc) => {
        return {
            id: doc.id,
            name: doc.data().name
        }
    })
}