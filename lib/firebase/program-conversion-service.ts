import { db } from "./firebase"
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
  writeBatch,
  type WriteBatch,
} from "firebase/firestore"
import { fetchClients } from "./client-service"
import { v4 as uuidv4 } from "uuid"

// Types matching your mobile app structure
export interface MobileProgram {
  id: string
  name: string
  notes: string
  startedAt: string
  duration: number
  createdAt: string
  updatedAt: string
  program_URL: string
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
  programId: string // Add this field
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

interface Exercise {
  name: string
  sets?: Array<{
    reps?: string | number
    weight?: string | number
    rpe?: string | number
    rest?: string | number
    notes?: string
    set_number?: number
  }>
  notes?: string
  order?: number
}

interface Routine {
  name?: string
  title?: string
  exercises: Exercise[]
  order?: number
}

interface Week {
  week_number: number
  routines: Routine[]
}

interface Program {
  name?: string
  program_title?: string
  title?: string
  description?: string
  duration_weeks?: number
  program_weeks?: number
  is_periodized?: boolean
  weeks?: Week[]
  routines?: Routine[]
  notes?: string
}

export class ProgramConversionService {
  /**
   * Ensures an exercise exists in either global or user's custom collection
   * Creates it if it doesn't exist
   */
  private async ensureExerciseExists(userId: string, exerciseName: string): Promise<string> {
    console.log(`[ensureExerciseExists] Checking for exercise: ${exerciseName}`)

    try {
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
        muscleGroup: "Other",
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
    } catch (error) {
      console.error(`[ensureExerciseExists] Error processing exercise ${exerciseName}:`, error)
      throw error
    }
  }

  /**
   * Generate a meaningful routine name based on available data
   */
  private generateRoutineName(routineData: any, weekNumber: number, routineIndex = 0): string {
    console.log(`[generateRoutineName] Generating name for routine data:`, {
      routine_name: routineData.routine_name,
      name: routineData.name,
      day: routineData.day,
      title: routineData.title,
      weekNumber,
      routineIndex,
      availableKeys: Object.keys(routineData || {}),
    })

    // Strategy 1: Use explicit routine name fields
    if (routineData.routine_name && typeof routineData.routine_name === "string" && routineData.routine_name.trim()) {
      return routineData.routine_name.trim()
    }

    if (routineData.name && typeof routineData.name === "string" && routineData.name.trim()) {
      return routineData.name.trim()
    }

    if (routineData.title && typeof routineData.title === "string" && routineData.title.trim()) {
      return routineData.title.trim()
    }

    // Strategy 2: Use day information if available
    if (routineData.day && typeof routineData.day === "string" && routineData.day.trim()) {
      return `Week ${weekNumber} - ${routineData.day.trim()}`
    }

    // Strategy 3: Generate name from exercise names
    if (routineData.exercises && Array.isArray(routineData.exercises) && routineData.exercises.length > 0) {
      const exerciseNames = routineData.exercises
        .filter((ex) => ex && ex.name && typeof ex.name === "string")
        .map((ex) => ex.name.trim())
        .slice(0, 2)

      if (exerciseNames.length > 0) {
        const exercisesPart = exerciseNames.join(" + ")
        return `Week ${weekNumber} - ${exercisesPart}${exerciseNames.length < routineData.exercises.length ? " +more" : ""}`
      }
    }

    // Strategy 4: Use workout type or body part if available
    if (routineData.workout_type && typeof routineData.workout_type === "string" && routineData.workout_type.trim()) {
      return `Week ${weekNumber} - ${routineData.workout_type.trim()}`
    }

    if (routineData.body_part && typeof routineData.body_part === "string" && routineData.body_part.trim()) {
      return `Week ${weekNumber} - ${routineData.body_part.trim()}`
    }

    // Strategy 5: Generic fallback with meaningful info
    return `Week ${weekNumber} - Workout ${routineIndex + 1}`
  }

  /**
   * Creates a routine document using batch operations for better performance
   */
  private async createRoutineBatch(
    userId: string,
    routineData: any,
    weekNumber: number,
    routineIndex = 0,
    batch: WriteBatch,
    programId: string, // Add programId parameter
  ): Promise<{ routineId: string; week: number; order: number }> {
    const routineId = uuidv4()
    const timestamp = Timestamp.now()

    console.log(`[createRoutineBatch] Creating routine ${routineIndex + 1} for week ${weekNumber}`)

    if (!routineData) {
      routineData = { exercises: [] }
    }

    const routineName = this.generateRoutineName(routineData, weekNumber, routineIndex)
    const exercises = []
    const exercisesArray = routineData.exercises || []

    if (Array.isArray(exercisesArray) && exercisesArray.length > 0) {
      for (const exercise of exercisesArray) {
        if (!exercise || !exercise.name || typeof exercise.name !== "string" || exercise.name.trim() === "") {
          continue
        }

        try {
          const exerciseId = await this.ensureExerciseExists(userId, exercise.name.trim())

          let sets = exercise.sets || []
          if (!Array.isArray(sets) || sets.length === 0) {
            sets = [
              { reps: "10", weight: "", rpe: "", rest: "60s", notes: "" },
              { reps: "10", weight: "", rpe: "", rest: "60s", notes: "" },
              { reps: "10", weight: "", rpe: "", rest: "60s", notes: "" },
            ]
          }

          const mobileSets = sets.map((set: any) => {
            if (!set || typeof set !== "object") {
              return {
                id: uuidv4(),
                type: "normal",
                weight: "",
                reps: "10",
              }
            }

            const cleanSet = {
              id: uuidv4(),
              type: set.warmup ? "warmup" : set.set_type || "normal",
              weight: set.weight !== undefined && set.weight !== null ? set.weight.toString() : "",
              reps: set.reps !== undefined && set.reps !== null ? set.reps.toString() : "10",
            }

            const notesParts = []
            if (set.rpe !== undefined && set.rpe !== null && set.rpe !== "") notesParts.push(`RPE: ${set.rpe}`)
            if (set.rest !== undefined && set.rest !== null && set.rest !== "") notesParts.push(`Rest: ${set.rest}`)
            if (set.notes !== undefined && set.notes !== null && set.notes !== "") notesParts.push(set.notes)

            if (notesParts.length > 0) {
              cleanSet.notes = notesParts.join(" | ")
            }

            return cleanSet
          })

          exercises.push({
            id: exerciseId,
            name: exercise.name.trim(),
            sets: mobileSets,
          })
        } catch (exerciseError) {
          console.error(`[createRoutineBatch] Error processing exercise ${exercise.name}:`, exerciseError)
          continue
        }
      }
    }

    const routineDoc: MobileRoutine = {
      id: routineId,
      name: routineName,
      notes: routineData.notes && typeof routineData.notes === "string" ? routineData.notes : "",
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
      type: "program",
      programId: programId, // Add this line
      exercises,
    }

    const cleanRoutineDoc = this.removeUndefinedValues(routineDoc)

    // Add to batch instead of immediate write
    const routinesRef = collection(db, "users", userId, "routines")
    const routineDocRef = doc(routinesRef, routineId)
    batch.set(routineDocRef, cleanRoutineDoc)

    return {
      routineId,
      week: weekNumber,
      order: routineIndex + 1,
    }
  }

  /**
   * Recursively remove undefined values from an object to prevent Firestore errors
   */
  private removeUndefinedValues(obj: any): any {
    if (obj === null || obj === undefined) {
      return null
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.removeUndefinedValues(item))
    }

    if (typeof obj === "object") {
      const cleaned: any = {}
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = this.removeUndefinedValues(value)
        }
      }
      return cleaned
    }

    return obj
  }

  /**
   * Main function to convert and send program to client
   * FIXED: Better error handling and always create routines
   */
  async convertAndSendProgram(programData: any, clientUserId: string): Promise<string> {
    try {
      console.log(`[convertAndSendProgram] === STARTING OPTIMIZED PROGRAM CONVERSION ===`)
      console.log(`[convertAndSendProgram] Client User ID: ${clientUserId}`)

      const timestamp = Timestamp.now()
      const routineMap: Array<{ routineId: string; week: number; order: number }> = []

      // Generate programId first
      const programId = uuidv4()

      // Batch all Firebase operations to reduce timeout risk
      const batch = writeBatch(db)
      const routinePromises: Promise<{ routineId: string; week: number; order: number }>[] = []

      // Handle periodized programs (with weeks array)
      if (programData.weeks && Array.isArray(programData.weeks) && programData.weeks.length > 0) {
        console.log(`[convertAndSendProgram] Processing ${programData.weeks.length} weeks (PERIODIZED)`)

        for (let weekIndex = 0; weekIndex < programData.weeks.length; weekIndex++) {
          const week = programData.weeks[weekIndex]
          const weekNumber = week.week_number || weekIndex + 1

          if (week.routines && Array.isArray(week.routines)) {
            for (let routineIndex = 0; routineIndex < week.routines.length; routineIndex++) {
              const routine = week.routines[routineIndex]

              // Pass programId to createRoutineBatch
              routinePromises.push(
                this.createRoutineBatch(clientUserId, routine, weekNumber, routineIndex, batch, programId),
              )
            }
          }
        }
      }
      // Handle non-periodized programs
      else if (programData.routines && Array.isArray(programData.routines) && programData.routines.length > 0) {
        console.log(`[convertAndSendProgram] Processing ${programData.routines.length} routines (NON-PERIODIZED)`)

        const totalWeeks = programData.program_weeks || programData.duration_weeks || 1

        for (let week = 1; week <= totalWeeks; week++) {
          for (let routineIndex = 0; routineIndex < programData.routines.length; routineIndex++) {
            const routine = programData.routines[routineIndex]

            // Pass programId to createRoutineBatch
            routinePromises.push(this.createRoutineBatch(clientUserId, routine, week, routineIndex, batch, programId))
          }
        }
      }

      // Execute all routine creation promises in parallel (but limit concurrency)
      console.log(`[convertAndSendProgram] Creating ${routinePromises.length} routines in parallel`)

      // Process in chunks to avoid overwhelming Firebase
      const chunkSize = 10
      for (let i = 0; i < routinePromises.length; i += chunkSize) {
        const chunk = routinePromises.slice(i, i + chunkSize)
        const chunkResults = await Promise.all(chunk)
        routineMap.push(...chunkResults)
      }

      console.log(`[convertAndSendProgram] Total routines created: ${routineMap.length}`)

      // Create the program document (programId already generated above)
      const program: MobileProgram = {
        id: programId,
        name: programData.program_title || programData.title || programData.name || "Imported Program",
        notes: "",
        createdAt: timestamp,
        startedAt: timestamp,
        updatedAt: timestamp,
        duration: Number(
          programData.program_weeks ||
            programData.duration_weeks ||
            programData.weeks?.length ||
            programData.duration ||
            4,
        ),
        program_URL: "",
        routines: routineMap,
      }

      // Add program to batch
      const programsRef = collection(db, "users", clientUserId, "programs")
      const programDocRef = doc(programsRef, programId)
      batch.set(programDocRef, this.removeUndefinedValues(program))

      // Commit the entire batch at once
      console.log(`[convertAndSendProgram] Committing batch with program and all routines`)
      await batch.commit()

      console.log(`[convertAndSendProgram] ✅ Successfully created program: ${program.name} with ID: ${programId}`)
      return programId
    } catch (error) {
      console.error("[convertAndSendProgram] ❌ Error converting and sending program:", error)
      throw error
    }
  }

  /**
   * Get client's userId from trainer's client document
   * FIXED: Enhanced logging and validation
   */
  async getClientUserId(trainerId: string, clientId: string): Promise<string | null> {
    try {
      console.log(`[getClientUserId] === GETTING CLIENT USER ID ===`)
      console.log(`[getClientUserId] Trainer ID: ${trainerId}`)
      console.log(`[getClientUserId] Client ID: ${clientId}`)

      // Get the client document from trainer's clients collection
      const clientDocPath = `users/${trainerId}/clients/${clientId}`
      console.log(`[getClientUserId] Looking up client at: ${clientDocPath}`)

      const clientDoc = await getDoc(doc(db, "users", trainerId, "clients", clientId))

      if (!clientDoc.exists()) {
        console.log(`[getClientUserId] ❌ Client document not found at: ${clientDocPath}`)
        return null
      }

      const clientData = clientDoc.data()
      console.log(`[getClientUserId] Client document data:`, {
        hasUserId: !!clientData.userId,
        userId: clientData.userId,
        name: clientData.name,
        email: clientData.email,
        status: clientData.status,
        hasLinkedAccount: clientData.hasLinkedAccount,
      })

      const userId = clientData.userId || null

      if (!userId) {
        console.log(`[getClientUserId] ❌ No userId found in client document`)
        return null
      }

      console.log(`[getClientUserId] Found userId: ${userId}`)

      // Verify the user document exists
      const userDocPath = `users/${userId}`
      console.log(`[getClientUserId] Verifying user document at: ${userDocPath}`)

      const userDoc = await getDoc(doc(db, "users", userId))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        console.log(`[getClientUserId] ✅ User document exists:`, {
          id: userData.id,
          email: userData.email,
          status: userData.status,
          hasFirebaseAuth: userData.hasFirebaseAuth,
          firebaseUid: userData.firebaseUid,
        })
      } else {
        console.log(`[getClientUserId] ❌ User document does NOT exist at: ${userDocPath}`)
        return null
      }

      console.log(`[getClientUserId] ✅ Successfully resolved client ${clientId} to user ${userId}`)
      return userId
    } catch (error) {
      console.error("[getClientUserId] ❌ Error getting client user ID:", error)
      return null
    }
  }

  /**
   * Send program to client - main method called by the API
   * FIXED: Better error handling and validation
   */
  async sendProgramToClient(clientId: string, programData: any, customMessage?: string): Promise<any> {
    try {
      console.log(`[sendProgramToClient] === STARTING PROGRAM SEND PROCESS ===`)
      console.log(`[sendProgramToClient] Client ID: ${clientId}`)
      console.log(`[sendProgramToClient] Program: ${programData.name || programData.program_title}`)

      // Get the client's userId from the trainer's client document
      const trainerId = "5tVdK6LXCifZgjxD7rml3nEOXmh1" // This should come from auth context

      const clientUserId = await this.getClientUserId(trainerId, clientId)

      if (!clientUserId) {
        const errorMessage = "Client not found or client does not have a linked user account"
        console.log(`[sendProgramToClient] ❌ ${errorMessage}`)
        throw new Error(errorMessage)
      }

      console.log(`[sendProgramToClient] ✅ Client user ID resolved: ${clientUserId}`)

      // Convert and send the program
      const programId = await this.convertAndSendProgram(programData, clientUserId)

      console.log(`[sendProgramToClient] ✅ Program sent successfully. Program ID: ${programId}`)

      return {
        success: true,
        programId,
        clientUserId,
        message: customMessage || "Program sent successfully",
      }
    } catch (error) {
      console.error("[sendProgramToClient] ❌ Error:", error)
      throw error
    }
  }

  /**
   * Get all clients for a trainer
   */
  async getTrainerClients(trainerId: string): Promise<Array<{ id: string; name: string; email?: string }>> {
    try {
      const allClients = await fetchClients(trainerId)

      const activeClientsWithAccounts = allClients.filter((client) => {
        const hasUserId = client.userId && client.userId.trim() !== ""
        const isActive = client.status === "Active"
        const hasLinkedAccount = client.hasLinkedAccount === true

        return hasUserId && isActive && hasLinkedAccount
      })

      return activeClientsWithAccounts.map((client) => ({
        id: client.id,
        name: client.name,
        email: client.email || "",
        userId: client.userId,
      }))
    } catch (error) {
      console.error("[ProgramConversionService.getTrainerClients] ❌ Error:", error)
      return []
    }
  }
}

// Export singleton instance
export const programConversionService = new ProgramConversionService()
