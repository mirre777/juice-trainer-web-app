import { collection, doc, getDocs, serverTimestamp, setDoc } from "firebase/firestore"
import { ProgramWithRoutines, RoutineWithOrder } from "../global-programs/types"
import { db } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

export type SimpleExercise = {
  id: string
  name: string
  deletedAt?: Date | null
}

export type GetOrCreateExercise = {
  name: string
  id?: string
  muscleGroup?: string
  secondaryMuscleGroup?: string[]
  isCardio?: boolean
}

export async function importProgram(program: ProgramWithRoutines, userId: string) {
  console.log("importing program", program.id, "for user", userId)
  const allExercises = await getAllExercises(userId)

  // import routines sequentially and wait for the response
  const routines = await Promise.all(program?.routines.map(async (routine: RoutineWithOrder) => {
    await importRoutine(userId, routine, program.id, allExercises)
    return {
      routineId: routine.id,
      week: routine.week,
      order: routine.order
    }
  }))

  const newProgram = {
    id: program.id,
    name: program.name,
    notes: program.notes ?? "",
    routines: routines,
    isGlobal: true,
    hasAcknowledgedNewProgram: program.isOnboarding ?? false,
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
    const exerciseToGetOrCreate: GetOrCreateExercise = {
      name: exercise.name,
      id: exercise.id,
      muscleGroup: exercise.muscleGroup,
      secondaryMuscleGroup: exercise.secondaryMuscleGroup ?? [],
      isCardio: exercise.isCardio ?? false,
    };
    const exerciseId = await getOrCreateExercise(userId, allExercises, exerciseToGetOrCreate)
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

export async function getOrCreateProgramExercises(userId: string, exerciseNames: Map<string, GetOrCreateExercise>) {
  const allExercises = await getAllExercises(userId);
  const programExerciseNameToId = new Map<string, string>();
  // return map of exercise names to id do it in parallel
  await Promise.all(Array.from(exerciseNames.entries()).map(async ([exerciseName, exercise]) => {
    const cleanExerciseName = exerciseName.trim();
    const existingExercise = allExercises.find((e) => e.name.toLowerCase() === cleanExerciseName.toLowerCase());
    const exerciseId = existingExercise?.id ?? exercise.id ?? uuidv4();
    if (existingExercise && (!existingExercise.deletedAt || existingExercise.deletedAt === null)) {
        programExerciseNameToId.set(cleanExerciseName.toLowerCase(), existingExercise.id);
    } else {
      console.log("creating exercise", exercise)
      await createExercise(userId, {...exercise, id: exerciseId});
      programExerciseNameToId.set(cleanExerciseName.toLowerCase(), exerciseId)
    }
  }));
  console.log("programExerciseNameToId", programExerciseNameToId);
  return programExerciseNameToId;
}

async function getOrCreateExercise(userId: string, allExercises: SimpleExercise[], exercise: GetOrCreateExercise): Promise<string> {
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

async function createExercise(userId: string, exercise: GetOrCreateExercise): Promise<SimpleExercise> {
    const id = exercise.id ?? uuidv4()
    const exerciseRef = doc(db, "users", userId, "exercises", id)
    const now = serverTimestamp()

    const newExercise = {
        id,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup ?? "Other",
        secondaryMuscleGroup: exercise.secondaryMuscleGroup ?? [],
        isCardio: exercise.isCardio ?? false,
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
            name: doc.data().name,
            deletedAt: doc.data().deletedAt
        }
    })
}

async function getUserExercises(userId: string) {
    const exercises = await getDocs(collection(db, "users", userId, "exercises"))
    return exercises.docs.map((doc) => {
        return {
            id: doc.id,
            name: doc.data().name,
            deletedAt: doc.data().deletedAt
        }
    })
}