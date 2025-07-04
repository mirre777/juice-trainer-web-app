import { db } from "./firebase"
import { collection, doc, setDoc, getDoc, getDocs, query, where, Timestamp } from "firebase/firestore"
import { fetchClients } from "./client-service" // Import the proper client service
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

    // Validate routine data
    if (!routineData) {
      throw new Error("Routine data is required")
    }

    const routineName = routineData.routine_name || routineData.name || "Unnamed Routine"
    console.log(`[createRoutine] Creating routine: ${routineName} for week ${weekNumber}`)
    console.log(`[createRoutine] Routine data:`, JSON.stringify(routineData, null, 2))

    // Process exercises and ensure they exist
    const exercises = []
    const exercisesArray = routineData.exercises || []

    if (!Array.isArray(exercisesArray)) {
      console.log(`[createRoutine] Warning: exercises is not an array for routine ${routineName}:`, exercisesArray)
      throw new Error(`Exercises must be an array for routine: ${routineName}`)
    }

    for (const exercise of exercisesArray) {
      if (!exercise || !exercise.name) {
        console.log(`[createRoutine] Warning: skipping exercise with no name:`, exercise)
        continue
      }

      const exerciseId = await this.ensureExerciseExists(userId, exercise.name)

      // Get the sets for this specific week - with better error handling
      const weekData = exercise.weeks?.find((w: any) => w.week_number === weekNumber)
      let sets = weekData?.sets || exercise.sets || []

      // Ensure sets is always an array
      if (!Array.isArray(sets)) {
        console.log(`[createRoutine] Warning: sets is not an array for exercise ${exercise.name}:`, sets)
        sets = []
      }

      const mobileSets = sets.map((set: any) => {
        // Ensure set is an object
        if (!set || typeof set !== "object") {
          console.log(`[createRoutine] Warning: invalid set data for exercise ${exercise.name}:`, set)
          return {
            id: uuidv4(),
            type: "normal",
            weight: "",
            reps: "",
            notes: undefined,
          }
        }

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
          notes: notesParts.length > 0 ? notesParts.join(" | ") : undefined,
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
      name: routineName,
      notes: routineData.notes || "",
      createdAt: timestamp.toDate().toISOString(),
      updatedAt: timestamp.toDate().toISOString(),
      deletedAt: null,
      type: "program", // This is the key flag for mobile app filtering
      exercises,
    }

    // Log the routine document before saving to debug any undefined values
    console.log(`[createRoutine] Routine document to save:`, JSON.stringify(routineDoc, null, 2))

    // Validate that no fields are undefined before saving
    if (routineDoc.name === undefined || routineDoc.name === null) {
      throw new Error(`Routine name cannot be undefined or null`)
    }

    // Save routine to Firestore
    const routinesRef = collection(db, "users", userId, "routines")
    await setDoc(doc(routinesRef, routineId), routineDoc)

    console.log(`[createRoutine] ✅ Created routine: ${routineName} with ID: ${routineId}`)

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

        // ADD THIS: Check if user document exists and log its status
        if (userId) {
          const userDoc = await getDoc(doc(db, "users", userId))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            console.log(`[getClientUserId] User document exists with status: ${userData.status}`)
            console.log(`[getClientUserId] User data:`, {
              name: userData.name,
              email: userData.email,
              status: userData.status,
              hasFirebaseAuth: userData.hasFirebaseAuth,
            })
          } else {
            console.log(`[getClientUserId] User document does NOT exist at users/${userId}`)
          }
        }

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
   * Send program to client - main method called by the API
   */
  async sendProgramToClient(clientId: string, programData: any, customMessage?: string): Promise<any> {
    try {
      console.log(`[sendProgramToClient] Starting program send process...`)
      console.log(`[sendProgramToClient] Client ID: ${clientId}`)
      console.log(`[sendProgramToClient] Program: ${programData.name || programData.program_title}`)

      // Get the client's userId from the trainer's client document
      // We need to determine the trainer ID - this should come from the authenticated user
      // For now, let's extract it from the client document or use a default
      const trainerId = "5tVdK6LXCifZgjxD7rml3nEOXmh1" // This should come from auth context

      const clientUserId = await this.getClientUserId(trainerId, clientId)

      if (!clientUserId) {
        throw new Error("Client not found or client does not have a linked user account")
      }

      console.log(`[sendProgramToClient] Client user ID: ${clientUserId}`)

      // Convert and send the program using the existing method
      const programId = await this.convertAndSendProgram(programData, clientUserId)

      console.log(`[sendProgramToClient] ✅ Program sent successfully. Program ID: ${programId}`)

      return {
        success: true,
        programId,
        clientUserId,
        message: customMessage || "Program sent successfully",
      }
    } catch (error) {
      console.error("[sendProgramToClient] Error:", error)
      throw error
    }
  }

  /**
   * Get all clients for a trainer (for the selection dialog)
   * ENHANCED WITH COMPREHENSIVE PATH LOGGING AND USER DATA FOLLOWING
   */
  async getTrainerClients(trainerId: string): Promise<Array<{ id: string; name: string; email?: string }>> {
    try {
      console.log(`[ProgramConversionService.getTrainerClients] 🚀 === STARTING CLIENT SELECTION PROCESS ===`)
      console.log(`[ProgramConversionService.getTrainerClients] 🔍 Trainer ID: ${trainerId}`)
      console.log(`[ProgramConversionService.getTrainerClients] 📍 Will query paths:`)
      console.log(`[ProgramConversionService.getTrainerClients]   - Trainer: /users/${trainerId}`)
      console.log(`[ProgramConversionService.getTrainerClients]   - Clients: /users/${trainerId}/clients`)
      console.log(`[ProgramConversionService.getTrainerClients]   - User docs: /users/{userId} (for each client)`)

      // Use the enhanced fetchClients function that follows userId links
      const allClients = await fetchClients(trainerId)
      console.log(
        `[ProgramConversionService.getTrainerClients] 📊 fetchClients returned ${allClients.length} total clients`,
      )

      if (allClients.length === 0) {
        console.log(`[ProgramConversionService.getTrainerClients] ⚠️ NO CLIENTS FOUND`)
        console.log(`[ProgramConversionService.getTrainerClients] 🔍 Possible reasons:`)
        console.log(`[ProgramConversionService.getTrainerClients]   1. Collection /users/${trainerId}/clients is empty`)
        console.log(`[ProgramConversionService.getTrainerClients]   2. Trainer document doesn't exist`)
        console.log(`[ProgramConversionService.getTrainerClients]   3. Firebase permissions issue`)
        console.log(`[ProgramConversionService.getTrainerClients]   4. Network/connection problem`)
        return []
      }

      // Log all clients with their linked user data
      console.log(`[ProgramConversionService.getTrainerClients] 📋 All clients found:`)
      allClients.forEach((client, index) => {
        console.log(`[ProgramConversionService.getTrainerClients] Client ${index + 1}:`, {
          id: client.id,
          name: client.name,
          status: client.status,
          userId: client.userId || "NO_USER_ID",
          email: client.email || "NO_EMAIL",
          hasLinkedAccount: client.hasLinkedAccount || false,
          userStatus: client.userStatus || "unknown",
          isTemporary: client.isTemporary || false,
        })
      })

      // Filter to only active clients with linked accounts
      console.log(
        `[ProgramConversionService.getTrainerClients] 🔍 Filtering for active clients with linked accounts...`,
      )
      const activeClientsWithAccounts = allClients.filter((client) => {
        const hasUserId = client.userId && client.userId.trim() !== ""
        const isActive = client.status === "Active"
        const hasLinkedAccount = client.hasLinkedAccount === true

        console.log(`[ProgramConversionService.getTrainerClients] 🔍 Evaluating client ${client.name}:`, {
          hasUserId,
          isActive,
          hasLinkedAccount,
          status: client.status,
          userId: client.userId || "NONE",
          userStatus: client.userStatus || "unknown",
          willInclude: hasUserId && isActive && hasLinkedAccount,
        })

        return hasUserId && isActive && hasLinkedAccount
      })

      console.log(
        `[ProgramConversionService.getTrainerClients] ✅ After filtering: ${activeClientsWithAccounts.length} eligible clients`,
      )

      if (activeClientsWithAccounts.length === 0) {
        console.log(`[ProgramConversionService.getTrainerClients] ⚠️ NO ELIGIBLE CLIENTS FOR PROGRAM SENDING`)
        console.log(`[ProgramConversionService.getTrainerClients] 💡 Requirements for eligibility:`)
        console.log(`[ProgramConversionService.getTrainerClients]   - Must have userId field (linked account)`)
        console.log(`[ProgramConversionService.getTrainerClients]   - Status must be 'Active'`)
        console.log(`[ProgramConversionService.getTrainerClients]   - User document must exist at`)
        console.log(`[ProgramConversionService.getTrainerClients]   - User document must exist at /users/{userId}`)
        console.log(`[ProgramConversionService.getTrainerClients] 🔍 Check if clients have completed signup process`)
      }

      // Map to the format expected by the selection dialog
      const clientsForDialog = activeClientsWithAccounts.map((client) => ({
        id: client.id,
        name: client.name,
        email: client.email || "",
        userId: client.userId, // Include userId for program sending
      }))

      console.log(`[ProgramConversionService.getTrainerClients] 🎯 Final client list for dialog:`)
      clientsForDialog.forEach((client, index) => {
        console.log(`[ProgramConversionService.getTrainerClients] Dialog Client ${index + 1}:`, {
          id: client.id,
          name: client.name,
          email: client.email || "NO_EMAIL",
          userId: client.userId,
        })
      })

      console.log(`[ProgramConversionService.getTrainerClients] 🏁 === CLIENT SELECTION PROCESS COMPLETE ===`)
      return clientsForDialog
    } catch (error) {
      console.error("[ProgramConversionService.getTrainerClients] ❌ UNEXPECTED ERROR:", error)
      console.error("[ProgramConversionService.getTrainerClients] Error details:", {
        message: error.message,
        code: error.code,
        stack: error.stack?.substring(0, 500),
        trainerId,
      })
      return []
    }
  }
}

// Export singleton instance
export const programConversionService = new ProgramConversionService()
