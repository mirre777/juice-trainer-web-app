import { db } from "./firebase"
import { collection, doc, setDoc, getDoc, getDocs, query, where, Timestamp, writeBatch } from "firebase/firestore"
import { fetchClients } from "./client-service" // Import the proper client service
import { v4 as uuidv4 } from "uuid"

// Types matching your mobile app structure
export interface MobileProgram {
  id: string
  name: string
  notes: string
  startedAt: Timestamp
  duration: number
  createdAt: Timestamp
  updatedAt: Timestamp // Note: updatedAt not updated_at
  program_URL: string // Keep this field - it exists in working programs
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

interface WorkoutProgram {
  id: string
  name: string
  duration: number
  routines: Array<{
    routineId: string
    week: number
    order: number
  }>
  notes: string
  createdAt: Timestamp
  startedAt: Timestamp
  updated_at: Timestamp
}

interface RoutineData {
  id: string
  name: string
  type: string
  exercises: Array<{
    id: string
    name: string
    sets: number
    reps: string
    weight: string
    notes: string
    restTime: string
  }>
  createdAt: Timestamp
  updated_at: Timestamp
}

interface Exercise {
  name: string
  sets?: Array<{
    reps?: string
    weight?: string
    rpe?: string
    rest?: string
    notes?: string
    set_number?: number
  }>
  notes?: string
}

interface Routine {
  name?: string
  title?: string
  exercises: Exercise[]
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
        .slice(0, 2) // Take first 2 exercises

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
   * Creates a routine document in the user's routines collection
   * Based on uploadPeriodizedRoutines.js logic
   */
  private async createRoutine(
    userId: string,
    routineData: any,
    weekNumber: number,
    routineIndex = 0,
  ): Promise<{ routineId: string; routineDoc: MobileRoutine }> {
    const routineId = uuidv4()
    const timestamp = Timestamp.now()

    // Validate routine data
    if (!routineData) {
      throw new Error("Routine data is required")
    }

    // Generate a meaningful routine name
    const routineName = this.generateRoutineName(routineData, weekNumber, routineIndex)
    console.log(`[createRoutine] Creating routine: "${routineName}" for week ${weekNumber}`)
    console.log(`[createRoutine] Full routine data:`, JSON.stringify(routineData, null, 2))

    // Process exercises and ensure they exist
    const exercises = []
    const exercisesArray = routineData.exercises || []

    if (!Array.isArray(exercisesArray)) {
      console.log(`[createRoutine] Warning: exercises is not an array for routine ${routineName}:`, exercisesArray)
      throw new Error(`Exercises must be an array for routine: ${routineName}`)
    }

    console.log(`[createRoutine] Processing ${exercisesArray.length} exercises for routine: ${routineName}`)

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
          }
        }

        // CRITICAL FIX: Ensure no undefined values are passed to Firestore
        const cleanSet = {
          id: uuidv4(),
          type: set.warmup ? "warmup" : set.set_type || "normal",
          weight: set.weight !== undefined && set.weight !== null ? set.weight.toString() : "",
          reps: set.reps !== undefined && set.reps !== null ? set.reps.toString() : "",
        }

        // Only add notes if they exist and are not undefined
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
        name: exercise.name,
        sets: mobileSets,
      })
    }

    const routineDoc: MobileRoutine = {
      id: routineId,
      name: routineName,
      notes: routineData.notes && typeof routineData.notes === "string" ? routineData.notes : "",
      createdAt: timestamp.toDate().toISOString(),
      updatedAt: timestamp.toDate().toISOString(),
      deletedAt: null,
      type: "program", // This is the key flag for mobile app filtering
      exercises,
    }

    // Log the routine document before saving to debug any undefined values
    console.log(`[createRoutine] Routine document to save:`, {
      id: routineDoc.id,
      name: routineDoc.name,
      notes: routineDoc.notes,
      exerciseCount: routineDoc.exercises.length,
      type: routineDoc.type,
    })

    // Final validation that no critical fields are undefined
    if (!routineDoc.name || typeof routineDoc.name !== "string") {
      throw new Error(`Routine name must be a non-empty string, got: ${typeof routineDoc.name} - "${routineDoc.name}"`)
    }

    // CRITICAL FIX: Deep clean the routine document to remove any undefined values
    const cleanRoutineDoc = this.removeUndefinedValues(routineDoc)

    // Save routine to Firestore
    const routinesRef = collection(db, "users", userId, "routines")
    await setDoc(doc(routinesRef, routineId), cleanRoutineDoc)

    console.log(`[createRoutine] ✅ Created routine: "${routineName}" with ID: ${routineId}`)

    return { routineId, routineDoc: cleanRoutineDoc }
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
   * UPDATED TO MATCH WORKING PROGRAM STRUCTURE FROM USER 8OGA
   */
  async convertAndSendProgram(programData: any, clientUserId: string): Promise<string> {
    try {
      console.log(`[convertAndSendProgram] Converting program for client: ${clientUserId}`)
      console.log(`[convertAndSendProgram] Program data structure:`, {
        hasWeeks: !!programData.weeks,
        hasRoutines: !!programData.routines,
        weeksLength: programData.weeks?.length,
        routinesLength: programData.routines?.length,
        programTitle: programData.program_title || programData.title || programData.name,
        availableKeys: Object.keys(programData || {}),
      })

      const timestamp = Timestamp.now()
      const routineMap: Array<{ routineId: string; week: number; order: number }> = []

      // Handle periodized programs (with weeks array)
      if (programData.weeks && Array.isArray(programData.weeks)) {
        console.log(`[convertAndSendProgram] Processing ${programData.weeks.length} weeks`)

        for (const week of programData.weeks) {
          const weekNumber = week.week_number || 1

          if (week.routines && Array.isArray(week.routines)) {
            for (let routineIndex = 0; routineIndex < week.routines.length; routineIndex++) {
              const routine = week.routines[routineIndex]

              const { routineId } = await this.createRoutine(clientUserId, routine, weekNumber, routineIndex)

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
        const totalWeeks = programData.program_weeks || programData.duration_weeks || 1

        for (let week = 1; week <= totalWeeks; week++) {
          for (let routineIndex = 0; routineIndex < programData.routines.length; routineIndex++) {
            const routine = programData.routines[routineIndex]

            const { routineId } = await this.createRoutine(clientUserId, routine, week, routineIndex)

            routineMap.push({
              routineId,
              week,
              order: routineIndex + 1,
            })
          }
        }
      }

      // Create the program document - MATCH THE EXACT STRUCTURE OF THE WORKING PROGRAM FROM USER 8OGA
      const programId = uuidv4()

      // Use Firestore Timestamp objects (not ISO strings)
      const firestoreTimestamp = timestamp

      const program: MobileProgram = {
        id: programId,
        name: programData.program_title || programData.title || programData.name || "Imported Program",
        notes: "", // Always empty string, never null or undefined
        // Use Firestore Timestamp objects to match working program
        createdAt: firestoreTimestamp,
        startedAt: firestoreTimestamp,
        updatedAt: firestoreTimestamp,
        duration: Number(
          programData.program_weeks ||
            programData.duration_weeks ||
            programData.weeks?.length ||
            programData.duration ||
            4,
        ),
        program_URL: "", // Keep this field - it exists in working programs
        routines: routineMap,
        // DO NOT include isActive or status - they don't exist in working programs
      }

      // CRITICAL FIX: Clean the program document to remove any undefined values
      const cleanProgram = this.removeUndefinedValues(program)

      // Save program to Firestore
      const programsRef = collection(db, "users", clientUserId, "programs")
      await setDoc(doc(programsRef, programId), cleanProgram)

      console.log(`[convertAndSendProgram] ✅ Created program: ${program.name} with ID: ${programId}`)
      console.log(`[convertAndSendProgram] Program structure matches working program from user 8oga:`, {
        totalRoutines: routineMap.length,
        weeks: program.duration,
        hasTimestampObjects: program.createdAt instanceof Timestamp,
        fieldName: "updatedAt", // not updated_at
        hasProgramURL: typeof program.program_URL === "string",
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

  /**
   * Converts a Google Sheets program structure to Firebase format and assigns it to a user
   */
  async convertAndAssignProgram(
    userId: string,
    programData: any,
    clientId?: string,
  ): Promise<{ success: boolean; programId?: string; error?: string }> {
    try {
      console.log("Starting program conversion for user:", userId)
      console.log("Program data:", JSON.stringify(programData, null, 2))

      // Generate unique program ID
      const programId = generateProgramId()
      const now = Timestamp.now()

      // Convert program structure
      const program: WorkoutProgram = {
        id: programId,
        name: programData.name || "Imported Program",
        duration: Number(programData.duration) || 4,
        routines: [],
        notes: "", // Always empty string, never null
        createdAt: now,
        startedAt: now,
        updated_at: now,
      }

      // Process routines
      const batch = writeBatch(db)
      const routineIds: string[] = []

      if (programData.weeks && Array.isArray(programData.weeks)) {
        let routineOrder = 1

        for (const week of programData.weeks) {
          if (week.days && Array.isArray(week.days)) {
            for (const day of week.days) {
              if (day.exercises && Array.isArray(day.exercises) && day.exercises.length > 0) {
                const routineId = generateRoutineId()
                routineIds.push(routineId)

                // Create routine document
                const routine: RoutineData = {
                  id: routineId,
                  name: day.name || `Day ${routineOrder}`,
                  type: "workout",
                  exercises: day.exercises.map((exercise: any, index: number) => ({
                    id: `exercise_${index + 1}`,
                    name: exercise.name || "Unknown Exercise",
                    sets: Number(exercise.sets) || 3,
                    reps: String(exercise.reps || "10"),
                    weight: exercise.weight ? String(exercise.weight) : "",
                    notes: exercise.notes || "",
                    restTime: exercise.restTime || "60s",
                  })),
                  createdAt: now,
                  updated_at: now,
                }

                // Add routine to batch
                const routineRef = doc(db, "users", userId, "routines", routineId)
                batch.set(routineRef, routine)

                // Add to program routines array
                program.routines.push({
                  routineId: routineId,
                  week: week.week || 1,
                  order: routineOrder,
                })

                routineOrder++
              }
            }
          }
        }
      }

      // Validate we have routines
      if (program.routines.length === 0) {
        throw new Error("No valid routines found in program data")
      }

      // Add program to batch
      const programRef = doc(db, "users", userId, "programs", programId)
      batch.set(programRef, program)

      // Commit all changes
      await batch.commit()

      console.log("Program conversion completed successfully")
      console.log("Program ID:", programId)
      console.log("Routines created:", routineIds.length)

      return {
        success: true,
        programId: programId,
      }
    } catch (error) {
      console.error("Error converting program:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }

  /**
   * Validates that a program and its routines exist and are properly structured
   */
  async validateProgramStructure(userId: string, programId: string): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = []

    try {
      // Check program exists
      const programRef = doc(db, "users", userId, "programs", programId)
      const programSnap = await getDoc(programRef)

      if (!programSnap.exists()) {
        issues.push("Program document does not exist")
        return { valid: false, issues }
      }

      const programData = programSnap.data() as WorkoutProgram

      // Validate required fields
      if (!programData.id) issues.push("Missing program id")
      if (!programData.name) issues.push("Missing program name")
      if (typeof programData.duration !== "number") issues.push("Duration is not a number")
      if (!Array.isArray(programData.routines)) issues.push("Routines is not an array")
      if (typeof programData.notes !== "string") issues.push("Notes is not a string")

      // Validate timestamps are Timestamp objects
      if (!(programData.createdAt instanceof Timestamp)) issues.push("createdAt is not a Timestamp object")
      if (!(programData.startedAt instanceof Timestamp)) issues.push("startedAt is not a Timestamp object")
      if (!(programData.updated_at instanceof Timestamp)) issues.push("updated_at is not a Timestamp object")

      // Check each routine exists
      for (const routineRef of programData.routines) {
        const routineDoc = await getDoc(doc(db, "users", userId, "routines", routineRef.routineId))
        if (!routineDoc.exists()) {
          issues.push(`Routine ${routineRef.routineId} does not exist`)
        }
      }

      return {
        valid: issues.length === 0,
        issues,
      }
    } catch (error) {
      issues.push(`Validation error: ${error instanceof Error ? error.message : "Unknown error"}`)
      return { valid: false, issues }
    }
  }

  /**
   * Fixes common program structure issues
   */
  async fixProgramStructure(userId: string, programId: string): Promise<{ success: boolean; fixesApplied: string[] }> {
    const fixesApplied: string[] = []

    try {
      const programRef = doc(db, "users", userId, "programs", programId)
      const programSnap = await getDoc(programRef)

      if (!programSnap.exists()) {
        throw new Error("Program does not exist")
      }

      const programData = programSnap.data()
      const updates: any = {}

      // Fix timestamp fields if they're strings
      const now = Timestamp.now()

      if (typeof programData.createdAt === "string") {
        updates.createdAt = now
        fixesApplied.push("Fixed createdAt timestamp")
      }

      if (typeof programData.startedAt === "string") {
        updates.startedAt = now
        fixesApplied.push("Fixed startedAt timestamp")
      }

      if (typeof programData.updated_at === "string") {
        updates.updated_at = now
        fixesApplied.push("Fixed updated_at timestamp")
      }

      // Fix notes field
      if (programData.notes === null || programData.notes === undefined) {
        updates.notes = ""
        fixesApplied.push("Fixed notes field")
      }

      // Remove problematic extra fields
      const fieldsToRemove = ["program_URL", "isActive", "status"]
      const batch = writeBatch(db)

      for (const field of fieldsToRemove) {
        if (programData[field] !== undefined) {
          // Note: Firestore doesn't have a direct way to remove fields in updates
          // We'll need to rewrite the document without these fields
          fixesApplied.push(`Removed ${field} field`)
        }
      }

      // Apply updates if any
      if (Object.keys(updates).length > 0 || fixesApplied.some((fix) => fix.includes("Removed"))) {
        // Create clean program data
        const cleanProgramData = {
          id: programData.id,
          name: programData.name,
          duration: Number(programData.duration),
          routines: programData.routines,
          notes: updates.notes || programData.notes || "",
          createdAt: updates.createdAt || programData.createdAt,
          startedAt: updates.startedAt || programData.startedAt,
          updated_at: updates.updated_at || programData.updated_at,
        }

        await setDoc(programRef, cleanProgramData)
        fixesApplied.push("Applied structure fixes")
      }

      return {
        success: true,
        fixesApplied,
      }
    } catch (error) {
      console.error("Error fixing program structure:", error)
      return {
        success: false,
        fixesApplied: [`Error: ${error instanceof Error ? error.message : "Unknown error"}`],
      }
    }
  }

  /**
   * Converts and sends a program to a client
   */
  async convertAndSendProgramToClient(
    clientId: string,
    programData: Program,
    trainerId: string,
    customMessage?: string,
  ): Promise<{ success: boolean; programId?: string; error?: string }> {
    try {
      console.log("[convertAndSendProgramToClient] Starting conversion:", {
        clientId,
        programName: programData.name,
        trainerId,
        hasCustomMessage: !!customMessage,
      })

      // Generate program ID
      const programId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const now = Timestamp.now()

      // Create the program document for the client
      const programDoc = {
        id: programId,
        name: programData.name || "Untitled Program",
        notes: programData.notes || "",
        duration: programData.duration_weeks || 1,
        createdAt: now,
        updatedAt: now,
        program_URL: "", // Keep this field as it was in working version
        // Remove isActive and status fields as they weren't in working version
      }

      // Save program to client's programs collection
      const clientProgramRef = doc(db, "users", clientId, "programs", programId)
      await setDoc(clientProgramRef, programDoc)

      console.log("[convertAndSendProgramToClient] Program document created:", programId)

      // Create routines from the program data
      const routines = programData.routines || programData.weeks?.[0]?.routines || []

      for (let routineIndex = 0; routineIndex < routines.length; routineIndex++) {
        const routine = routines[routineIndex]

        // Generate routine ID
        const routineId = `${programId}-routine-${routineIndex}`

        // Create routine document
        const routineDoc = {
          id: routineId,
          name: routine.name || `Routine ${routineIndex + 1}`,
          notes: "",
          type: "program", // Critical field for mobile app filtering
          updatedAt: now, // Use updatedAt, not updated_at
          exercises:
            routine.exercises?.map((exercise, exerciseIndex) => ({
              id: `${routineId}-exercise-${exerciseIndex}`,
              name: exercise.name,
              notes: exercise.notes || "",
              sets: Array.from({ length: exercise.sets?.length || 1 }, (_, setIndex) => {
                const set = exercise.sets?.[setIndex] || {}
                return {
                  id: `${routineId}-exercise-${exerciseIndex}-set-${setIndex}`,
                  notes: set.rpe ? `RPE: ${set.rpe} | Rest: ${set.rest || "-"}` : `Rest: ${set.rest || "-"}`,
                  reps: set.reps || "",
                  type: "normal",
                  weight: set.weight || "",
                }
              }),
            })) || [],
        }

        // Save routine to client's routines collection
        const clientRoutineRef = doc(db, "users", clientId, "routines", routineId)
        await setDoc(clientRoutineRef, routineDoc)

        console.log("[convertAndSendProgramToClient] Routine created:", routineId)
      }

      console.log("[convertAndSendProgramToClient] Conversion completed successfully")

      return {
        success: true,
        programId,
      }
    } catch (error) {
      console.error("[convertAndSendProgramToClient] Error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }
}

// Helper functions
function generateProgramId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function generateRoutineId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Export singleton instance
export const programConversionService = new ProgramConversionService()

// Export validation and fix functions for use in API routes
export { programConversionService as validateProgram, programConversionService as fixProgram }
