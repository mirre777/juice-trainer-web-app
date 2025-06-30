import { db } from "./firebase"
import { collection, doc, setDoc, getDoc, getDocs, query, where, Timestamp } from "firebase/firestore"
import { v4 as uuidv4 } from "uuid"

// Types matching your mobile app structure
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
  muscleGroup: string
  isCardio: boolean
  isFullBody: boolean
  isMobility: boolean
  createdAt: any
  updatedAt: any
  deletedAt: null
}

export class ProgramConversionService {
  /**
   * Ensures an exercise exists in either global or user's custom collection
   * Creates it if it doesn't exist
   */
  private async ensureExerciseExists(userId: string, exerciseName: string): Promise<string> {
    console.log(`[ensureExerciseExists] Checking for exercise: ${exerciseName}`)

    // First check global exercises collection
    const globalExercisesRef = collection(db, "exercises")
    const globalQuery = query(globalExercisesRef, where("name", "==", exerciseName))
    const globalSnapshot = await getDocs(globalQuery)

    if (!globalSnapshot.empty) {
      console.log(`[ensureExerciseExists] Found in global collection: ${globalSnapshot.docs[0].id}`)
      return globalSnapshot.docs[0].id
    }

    // Check user's custom exercises collection
    const userExercisesRef = collection(db, "users", userId, "exercises")
    const userQuery = query(userExercisesRef, where("name", "==", exerciseName))
    const userSnapshot = await getDocs(userQuery)

    if (!userSnapshot.empty) {
      console.log(`[ensureExerciseExists] Found in user collection: ${userSnapshot.docs[0].id}`)
      return userSnapshot.docs[0].id
    }

    // Create new exercise in user's collection
    const exerciseId = uuidv4()
    const timestamp = Timestamp.now()

    const exerciseDoc: MobileExercise = {
      id: exerciseId,
      name: exerciseName,
      muscleGroup: "Other", // Default muscle group
      isCardio: false,
      isFullBody: false,
      isMobility: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
    }

    await setDoc(doc(userExercisesRef, exerciseId), exerciseDoc)
    console.log(`[ensureExerciseExists] ✅ Created new exercise: ${exerciseName} with ID: ${exerciseId}`)

    return exerciseId
  }

  /**
   * Creates a routine document in the user's routines collection
   * Based on uploadPeriodizedRoutines.js logic
   */
  private async createRoutine(
    userId: string,
    routineData: any,
    weekNumber: number,
  ): Promise<{ routineId: string; routineDoc: MobileRoutine }> {
    const routineId = uuidv4()
    const timestamp = Timestamp.now()

    console.log(`[createRoutine] Creating routine: ${routineData.routine_name} for week ${weekNumber}`)

    // Process exercises and ensure they exist
    const exercises = []
    for (const exercise of routineData.exercises || []) {
      const exerciseId = await this.ensureExerciseExists(userId, exercise.name)

      // Get the sets for this specific week
      const weekData = exercise.weeks?.find((w: any) => w.week_number === weekNumber)
      const sets = weekData?.sets || exercise.sets || []

      const mobileSets = sets.map((set: any) => {
        // Combine RPE, rest, and notes into a single notes field like your example
        const notesParts = []
        if (set.rpe) notesParts.push(`RPE: ${set.rpe}`)
        if (set.rest) notesParts.push(`Rest: ${set.rest}`)
        if (set.notes) notesParts.push(set.notes)

        return {
          id: uuidv4(),
          type: set.warmup ? "warmup" : set.set_type || "normal",
          weight: set.weight?.toString() || "",
          reps: set.reps?.toString() || "",
          notes: notesParts.join(" | ") || undefined,
        }
      })

      exercises.push({
        id: exerciseId,
        name: exercise.name,
        sets: mobileSets,
      })
    }

    const routineDoc: MobileRoutine = {
      id: routineId,
      name: routineData.routine_name,
      notes: routineData.notes || "",
      createdAt: timestamp.toDate().toISOString(),
      updatedAt: timestamp.toDate().toISOString(),
      deletedAt: null,
      type: "program", // This is the key flag for mobile app filtering
      exercises,
    }

    // Save routine to Firestore
    const routinesRef = collection(db, "users", userId, "routines")
    await setDoc(doc(routinesRef, routineId), routineDoc)

    console.log(`[createRoutine] ✅ Created routine: ${routineData.routine_name} with ID: ${routineId}`)

    return { routineId, routineDoc }
  }

  /**
   * Main function to convert and send program to client
   * Based on uploadPeriodizedProgram.js logic
   */
  async convertAndSendProgram(programData: any, clientUserId: string): Promise<string> {
    try {
      console.log(`[convertAndSendProgram] Converting program for client: ${clientUserId}`)
      console.log(`[convertAndSendProgram] Program data:`, JSON.stringify(programData, null, 2))

      const timestamp = new Date()
      const routineMap: Array<{ routineId: string; week: number; order: number }> = []

      // Handle periodized programs (with weeks array)
      if (programData.weeks && Array.isArray(programData.weeks)) {
        console.log(`[convertAndSendProgram] Processing ${programData.weeks.length} weeks`)

        for (const week of programData.weeks) {
          const weekNumber = week.week_number || 1

          if (week.routines && Array.isArray(week.routines)) {
            for (let routineIndex = 0; routineIndex < week.routines.length; routineIndex++) {
              const routine = week.routines[routineIndex]

              const { routineId } = await this.createRoutine(clientUserId, routine, weekNumber)

              routineMap.push({
                routineId,
                week: weekNumber,
                order: routineIndex + 1,
              })
            }
          }
        }
      }
      // Handle non-periodized programs (direct routines array)
      else if (programData.routines && Array.isArray(programData.routines)) {
        console.log(`[convertAndSendProgram] Processing ${programData.routines.length} routines (non-periodized)`)

        // For non-periodized, repeat the same routines for each week
        const totalWeeks = programData.program_weeks || 1

        for (let week = 1; week <= totalWeeks; week++) {
          for (let routineIndex = 0; routineIndex < programData.routines.length; routineIndex++) {
            const routine = programData.routines[routineIndex]

            const { routineId } = await this.createRoutine(clientUserId, routine, 1) // Use week 1 data for all weeks

            routineMap.push({
              routineId,
              week,
              order: routineIndex + 1,
            })
          }
        }
      }

      // Create the program document (based on uploadPeriodizedProgram.js)
      const programId = uuidv4()
      const program: MobileProgram = {
        id: programId,
        name: programData.program_title || programData.title || programData.name || "Imported Program",
        notes: programData.program_notes || programData.notes || null,
        startedAt: timestamp.toISOString(),
        duration: programData.program_weeks || programData.weeks?.length || programData.duration || 4,
        createdAt: timestamp.toISOString(),
        updated_at: timestamp.toISOString(),
        routines: routineMap,
      }

      // Save program to Firestore
      const programsRef = collection(db, "users", clientUserId, "programs")
      await setDoc(doc(programsRef, programId), program)

      console.log(`[convertAndSendProgram] ✅ Created program: ${program.name} with ID: ${programId}`)
      console.log(`[convertAndSendProgram] Program structure:`, {
        totalRoutines: routineMap.length,
        weeks: program.duration,
        routineMap: routineMap.slice(0, 3), // Show first 3 for debugging
      })

      return programId
    } catch (error) {
      console.error("[convertAndSendProgram] Error converting and sending program:", error)
      throw error
    }
  }

  /**
   * Get client's userId from trainer's client document
   */
  async getClientUserId(trainerId: string, clientId: string): Promise<string | null> {
    try {
      console.log(`[getClientUserId] Getting userId for client ${clientId} of trainer ${trainerId}`)

      const clientDoc = await getDoc(doc(db, "users", trainerId, "clients", clientId))
      if (clientDoc.exists()) {
        const clientData = clientDoc.data()
        const userId = clientData.userId || null

        console.log(`[getClientUserId] Found userId: ${userId}`)
        return userId
      }

      console.log(`[getClientUserId] Client document not found`)
      return null
    } catch (error) {
      console.error("[getClientUserId] Error getting client user ID:", error)
      return null
    }
  }

  /**
   * Get all clients for a trainer (for the selection dialog)
   */
  async getTrainerClients(trainerId: string): Promise<Array<{ id: string; name: string; email?: string }>> {
    try {
      console.log(`[getTrainerClients] Fetching clients for trainer: ${trainerId}`)

      const clientsRef = collection(db, "users", trainerId, "clients")
      const snapshot = await getDocs(clientsRef)

      const clients = snapshot.docs
        .map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            name: data.name || "Unnamed Client",
            email: data.email || undefined,
            status: data.status,
            userId: data.userId,
          }
        })
        .filter((client) => client.status === "Active" && client.userId) // Only show active clients with linked accounts

      console.log(`[getTrainerClients] Found ${clients.length} active clients with linked accounts`)
      return clients
    } catch (error) {
      console.error("[getTrainerClients] Error fetching clients:", error)
      return []
    }
  }
}

export const programConversionService = new ProgramConversionService()
