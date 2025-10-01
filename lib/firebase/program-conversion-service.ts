import { db } from "./firebase"
import {
  collection,
  doc,
  getDoc,
  writeBatch,
  type WriteBatch,
  serverTimestamp,
} from "firebase/firestore"
import { fetchClients } from "./client-service"
import { v4 as uuidv4 } from "uuid"
import { getOrCreateProgramExercises } from "./program-import"
import { GetOrCreateExercise } from "./program-import/index"
// Types matching your mobile app structure
export interface MobileProgram {
  id: string
  name: string
  notes: string
  startedAt: any // Firestore Timestamp
  duration: number
  createdAt: any // Firestore Timestamp
  updatedAt: any // Firestore Timestamp
  program_URL: string
  hasAcknowledgedNewProgram?: boolean
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
  createdAt: any // Firestore Timestamp
  updatedAt: any // Firestore Timestamp
  deletedAt: null
  type: "program"
  programId: string
  exercises: Array<{
    id: string
    name: string
    sets: MobileSet[]
  }>
}

export interface MobileSet {
  id: string
  type: string
  weight: string
  reps: string
  notes?: string
}

export interface MobileExercise {
  id: string
  name: string
  muscleGroup: string
  isCardio: boolean
  isFullBody: boolean
  isMobility: boolean
  createdAt: any // Firestore Timestamp
  updatedAt: any // Firestore Timestamp
  deletedAt: null
}

export class ProgramConversionService {

  /**
   * Generate a meaningful routine name based on available data
   */
  private generateRoutineName(routineData: any, weekNumber: number, routineIndex = 0): string {
    console.log(`[generateRoutineName] Generating name for routine data:`, {
      name: routineData.name,
      weekNumber,
      routineIndex,
      availableKeys: Object.keys(routineData || {}),
    })

    if (routineData.name && typeof routineData.name === "string" && routineData.name.trim()) {
      return routineData.name.trim()
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
    programId: string,
    programExerciseNameToId: Map<string, string>,
  ): Promise<{ routineId: string; week: number; order: number }> {
    const routineId = routineData.id ?? uuidv4()
    const now = serverTimestamp()

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
          const cleanExerciseName = exercise.name.trim().toLowerCase();
          const exerciseId = programExerciseNameToId.get(cleanExerciseName)!!

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
                notes: "",
              }
            }

            const cleanSet = {
              id: uuidv4(),
              type: set.warmup ? "warmup" : set.set_type || "normal",
              weight: set.weight !== undefined && set.weight !== null ? set.weight.toString() : "",
              reps: set.reps !== undefined && set.reps !== null ? set.reps.toString() : "10",
              notes: "",
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
            ...exercise,
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
      notes: routineData.notes ?? "",
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      type: "program",
      programId: programId,
      exercises,
    }

    // Add to batch WITHOUT calling removeUndefinedValues to preserve serverTimestamp()
    const routinesRef = collection(db, "users", userId, "routines")
    const routineDocRef = doc(routinesRef, routineId)
    console.log("routine", routineDoc)
    batch.set(routineDocRef, routineDoc)

    return {
      routineId,
      week: weekNumber,
      order: routineIndex + 1,
    }
  }

  /**
   * Recursively remove undefined values from an object to prevent Firestore errors
   * FIXED: Now preserves serverTimestamp() sentinel values
   */
  private removeUndefinedValues(obj: any): any {
    if (obj === null || obj === undefined) {
      return null
    }

    // CRITICAL FIX: Check if this is a serverTimestamp() sentinel value
    if (obj && typeof obj === "object" && obj._methodName === "serverTimestamp") {
      console.log("[removeUndefinedValues] Preserving serverTimestamp sentinel value")
      return obj // Return the serverTimestamp() as-is without processing
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

  async getProgramExerciseNames(programData: any): Promise<Map<string, GetOrCreateExercise>> {
    const exerciseMap = new Map<string, GetOrCreateExercise>();
    if (programData.weeks && Array.isArray(programData.weeks) && programData.weeks.length > 0) {
      programData.weeks.flatMap((week: any) => week.routines.flatMap((routine: any) => routine.exercises.flatMap((exercise: any) => exerciseMap.set(exercise.name, { name: exercise.name, id: exercise.id, muscleGroup: exercise.muscleGroup }))));
    } else if (programData.routines && Array.isArray(programData.routines) && programData.routines.length > 0) {
      programData.routines.flatMap((routine: any) => routine.exercises.flatMap((exercise: any) => exerciseMap.set(exercise.name, { name: exercise.name, id: exercise.id, muscleGroup: exercise.muscleGroup })));
    }
    return exerciseMap;
  }

  /**
   * Main function to convert and send program to client
   */
  async convertAndSendProgram(programData: any, clientUserId: string): Promise<string> {
    try {
      console.log(`[convertAndSendProgram] === STARTING PROGRAM CONVERSION WITH SERVER TIMESTAMPS ===`)
      console.log(`[convertAndSendProgram] Client User ID: ${clientUserId}`)

      const routineMap: Array<{ routineId: string; week: number; order: number }> = []

      // Generate programId first
      const programId = programData.id ?? uuidv4()
      const now = serverTimestamp()

      console.log(`[convertAndSendProgram] Using serverTimestamp():`, now)
      console.log(`[convertAndSendProgram] Timestamp type:`, typeof now)

      const programExerciseNames = await this.getProgramExerciseNames(programData);
      console.log("programExerciseNames", programExerciseNames)
      const programExerciseNameToId = await getOrCreateProgramExercises(clientUserId, programExerciseNames);

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

              routinePromises.push(
                this.createRoutineBatch(clientUserId, routine, weekNumber, routineIndex, batch, programId, programExerciseNameToId),
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

            routinePromises.push(this.createRoutineBatch(clientUserId, routine, week, routineIndex, batch, programId, programExerciseNameToId))
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

      // Create the program document with proper Firestore Timestamps using serverTimestamp()
      const program: MobileProgram = {
        id: programId,
        name: programData.program_title || programData.title || programData.name || "Imported Program",
        startedAt: programData.start_date || now,
        hasAcknowledgedNewProgram: false,
        notes: "",
        createdAt: now,
        updatedAt: now,
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

      console.log(`[convertAndSendProgram] Program object before saving:`, {
        id: program.id,
        name: program.name,
        createdAt: program.createdAt,
        createdAtType: typeof program.createdAt,
      })

      // Add program to batch WITHOUT removeUndefinedValues to preserve serverTimestamp()
      const programsRef = collection(db, "users", clientUserId, "programs")
      const programDocRef = doc(programsRef, programId)
      batch.set(programDocRef, program)

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
   */
  async sendProgramToClient(trainerId: string, clientId: string, programData: any, customMessage?: string): Promise<any> {
    try {
      console.log(`[sendProgramToClient] === STARTING PROGRAM SEND PROCESS ===`)
      console.log(`[sendProgramToClient] Client ID: ${clientId}`)
      console.log(`[sendProgramToClient] Program: ${programData.name || programData.program_title}`)

      // Get the client's userId from the trainer's client document

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
        return hasUserId && isActive
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
