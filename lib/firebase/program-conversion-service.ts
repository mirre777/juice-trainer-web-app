import { db } from "./firebase"
import { collection, doc, setDoc, getDoc, getDocs, query, where, Timestamp } from "firebase/firestore"
import { v4 as uuidv4 } from "uuid"

export interface ConvertedProgram {
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

export interface ConvertedRoutine {
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

export interface Exercise {
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

export class ProgramConversionService {
  private async ensureExerciseExists(userId: string, exerciseName: string): Promise<string> {
    // First check global exercises
    const globalExercisesRef = collection(db, "exercises")
    const globalQuery = query(globalExercisesRef, where("name", "==", exerciseName))
    const globalSnapshot = await getDocs(globalQuery)

    if (!globalSnapshot.empty) {
      return globalSnapshot.docs[0].id
    }

    // Check user's custom exercises
    const userExercisesRef = collection(db, "users", userId, "exercises")
    const userQuery = query(userExercisesRef, where("name", "==", exerciseName))
    const userSnapshot = await getDocs(userQuery)

    if (!userSnapshot.empty) {
      return userSnapshot.docs[0].id
    }

    // Create new exercise in user's collection
    const exerciseId = uuidv4()
    const timestamp = Timestamp.now()

    const exerciseDoc: Exercise = {
      id: exerciseId,
      name: exerciseName,
      muscleGroup: "Other",
      isCardio: false,
      isFullBody: false,
      isMobility: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
    }

    await setDoc(doc(userExercisesRef, exerciseId), exerciseDoc)
    console.log(`Created new exercise: ${exerciseName}`)

    return exerciseId
  }

  private async createRoutine(userId: string, routineData: any): Promise<string> {
    const routineId = uuidv4()
    const timestamp = Timestamp.now()

    // Process exercises and ensure they exist
    const exercises = []
    for (const exercise of routineData.exercises || []) {
      const exerciseId = await this.ensureExerciseExists(userId, exercise.name)

      exercises.push({
        id: exerciseId,
        name: exercise.name,
        sets: (exercise.sets || []).map((set: any) => ({
          id: uuidv4(),
          type: set.type || "normal",
          weight: set.weight || "",
          reps: set.reps || "",
          notes: set.notes || "",
        })),
      })
    }

    const routine: ConvertedRoutine = {
      id: routineId,
      name: routineData.name,
      notes: routineData.notes || "",
      createdAt: timestamp.toDate().toISOString(),
      updatedAt: timestamp.toDate().toISOString(),
      deletedAt: null,
      type: "program",
      exercises,
    }

    const routinesRef = collection(db, "users", userId, "routines")
    await setDoc(doc(routinesRef, routineId), routine)

    return routineId
  }

  async convertAndSendProgram(programData: any, clientUserId: string): Promise<string> {
    try {
      const timestamp = new Date()
      const routineMap: Array<{ routineId: string; week: number; order: number }> = []

      // Handle periodized programs (with weeks)
      if (programData.weeks && Array.isArray(programData.weeks)) {
        for (const week of programData.weeks) {
          const weekNumber = week.week_number || 1

          for (const routine of week.routines || []) {
            const routineId = await this.createRoutine(clientUserId, routine)
            routineMap.push({
              routineId,
              week: weekNumber,
              order: routine.order || 1,
            })
          }
        }
      }
      // Handle simple programs (direct routines array)
      else if (programData.routines && Array.isArray(programData.routines)) {
        for (let i = 0; i < programData.routines.length; i++) {
          const routine = programData.routines[i]
          const routineId = await this.createRoutine(clientUserId, routine)
          routineMap.push({
            routineId,
            week: 1,
            order: i + 1,
          })
        }
      }

      // Create the program document
      const programId = uuidv4()
      const program: ConvertedProgram = {
        id: programId,
        name: programData.title || programData.name || "Imported Program",
        notes: programData.notes || null,
        startedAt: timestamp.toISOString(),
        duration: programData.weeks?.length || programData.duration || 4,
        createdAt: timestamp.toISOString(),
        updated_at: timestamp.toISOString(),
        routines: routineMap,
      }

      const programsRef = collection(db, "users", clientUserId, "programs")
      await setDoc(doc(programsRef, programId), program)

      console.log(`Program "${program.name}" successfully sent to client ${clientUserId}`)
      return programId
    } catch (error) {
      console.error("Error converting and sending program:", error)
      throw error
    }
  }

  async getClientUserId(trainerId: string, clientId: string): Promise<string | null> {
    try {
      const clientDoc = await getDoc(doc(db, "users", trainerId, "clients", clientId))
      if (clientDoc.exists()) {
        const clientData = clientDoc.data()
        return clientData.userId || null
      }
      return null
    } catch (error) {
      console.error("Error getting client user ID:", error)
      return null
    }
  }
}

export const programConversionService = new ProgramConversionService()
