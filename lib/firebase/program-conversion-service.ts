import { db } from "./firebase"
import { collection, doc, setDoc, getDoc, getDocs, query, where, Timestamp } from "firebase/firestore"
import { fetchClients } from "./client-service"
import { v4 as uuidv4 } from "uuid"

// Types matching your mobile app structure
export interface MobileProgram {
  id: string
  name: string
  notes: string
  startedAt: Timestamp
  duration: number
  createdAt: Timestamp
  updatedAt: Timestamp
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
   * Creates a routine document in the user's routines collection
   * FIXED: Always create routines, even with empty exercises
   */
  private async createRoutine(
    userId: string,
    routineData: any,
    weekNumber: number,
    routineIndex = 0,
  ): Promise<{ routineId: string; routineDoc: MobileRoutine }> {
    const routineId = uuidv4()
    const timestamp = Timestamp.now()

    console.log(`[createRoutine] === CREATING ROUTINE ===`)
    console.log(`[createRoutine] User ID: ${userId}`)
    console.log(`[createRoutine] Routine ID: ${routineId}`)
    console.log(`[createRoutine] Week Number: ${weekNumber}`)
    console.log(`[createRoutine] Routine Index: ${routineIndex}`)
    console.log(`[createRoutine] Routine Data:`, JSON.stringify(routineData, null, 2))

    // Validate routine data
    if (!routineData) {
      console.log(`[createRoutine] No routine data provided, creating empty routine`)
      routineData = { exercises: [] }
    }

    // Generate a meaningful routine name
    const routineName = this.generateRoutineName(routineData, weekNumber, routineIndex)
    console.log(`[createRoutine] Generated routine name: "${routineName}"`)

    // Process exercises - ALWAYS CREATE ROUTINE EVEN IF NO EXERCISES
    const exercises = []
    const exercisesArray = routineData.exercises || []

    console.log(`[createRoutine] Processing ${exercisesArray.length} exercises for routine: ${routineName}`)

    if (Array.isArray(exercisesArray) && exercisesArray.length > 0) {
      for (let exerciseIndex = 0; exerciseIndex < exercisesArray.length; exerciseIndex++) {
        const exercise = exercisesArray[exerciseIndex]

        // NEW CODE - Handle both 'name' and 'id' fields:
        const exerciseName = exercise.name || exercise.id
        if (!exercise || !exerciseName || typeof exerciseName !== "string" || exerciseName.trim() === "") {
          console.log(`[createRoutine] Skipping exercise ${exerciseIndex} with invalid name/id:`, exercise)
          continue
        }

        console.log(`[createRoutine] Processing exercise ${exerciseIndex + 1}: ${exerciseName}`)

        try {
          const exerciseId = await this.ensureExerciseExists(userId, exerciseName.trim())

          // Process sets for this exercise
          let sets = exercise.sets || []

          // If no sets provided, create default sets
          if (!Array.isArray(sets) || sets.length === 0) {
            console.log(`[createRoutine] No sets found for exercise ${exercise.name}, creating default sets`)
            sets = [
              { reps: "10", weight: "", rpe: "", rest: "60s", notes: "" },
              { reps: "10", weight: "", rpe: "", rest: "60s", notes: "" },
              { reps: "10", weight: "", rpe: "", rest: "60s", notes: "" },
            ]
          }

          console.log(`[createRoutine] Exercise ${exercise.name} has ${sets.length} sets`)

          const mobileSets = sets.map((set: any, setIndex: number) => {
            // Ensure set is an object
            if (!set || typeof set !== "object") {
              console.log(
                `[createRoutine] Warning: invalid set data for exercise ${exercise.name}, set ${setIndex}:`,
                set,
              )
              return {
                id: uuidv4(),
                type: "normal",
                weight: "",
                reps: "10",
              }
            }

            // Create clean set with no undefined values
            const cleanSet = {
              id: uuidv4(),
              type: set.warmup ? "warmup" : set.set_type || "normal",
              weight: set.weight !== undefined && set.weight !== null ? set.weight.toString() : "",
              reps: set.reps !== undefined && set.reps !== null ? set.reps.toString() : "10",
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
            name: exerciseName.trim(), // Use the resolved name
            sets: mobileSets,
          })

          console.log(`[createRoutine] ✅ Added exercise: ${exerciseName} with ${mobileSets.length} sets`)
        } catch (exerciseError) {
          console.error(`[createRoutine] Error processing exercise ${exercise.name}:`, exerciseError)
          // Continue with other exercises instead of failing completely
          continue
        }
      }
    } else {
      console.log(`[createRoutine] No exercises provided or exercises is not an array - creating empty routine`)
    }

    console.log(`[createRoutine] Total exercises processed: ${exercises.length}`)

    // CRITICAL FIX: Always create routine even if no exercises
    // The mobile app can handle empty routines and trainers can add exercises later
    const routineDoc: MobileRoutine = {
      id: routineId,
      name: routineName,
      notes: routineData.notes && typeof routineData.notes === "string" ? routineData.notes : "",
      createdAt: timestamp.toDate().toISOString(),
      updatedAt: timestamp.toDate().toISOString(),
      deletedAt: null,
      type: "program",
      exercises,
    }

    // Log the routine document before saving
    console.log(`[createRoutine] Routine document to save:`, {
      id: routineDoc.id,
      name: routineDoc.name,
      notes: routineDoc.notes,
      exerciseCount: routineDoc.exercises.length,
      type: routineDoc.type,
    })

    // Final validation
    if (!routineDoc.name || typeof routineDoc.name !== "string") {
      throw new Error(`Routine name must be a non-empty string, got: ${typeof routineDoc.name} - "${routineDoc.name}"`)
    }

    // Clean the routine document to remove any undefined values
    const cleanRoutineDoc = this.removeUndefinedValues(routineDoc)

    // Save routine to Firestore
    const routinesRef = collection(db, "users", userId, "routines")
    const routineDocRef = doc(routinesRef, routineId)

    console.log(`[createRoutine] Saving routine to: users/${userId}/routines/${routineId}`)
    await setDoc(routineDocRef, cleanRoutineDoc)

    console.log(`[createRoutine] ✅ Successfully created routine: "${routineName}" with ID: ${routineId}`)

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
   * FIXED: Better error handling and always create routines
   */
  async convertAndSendProgram(programData: any, clientUserId: string): Promise<string> {
    try {
      console.log(`[convertAndSendProgram] === STARTING PROGRAM CONVERSION ===`)
      console.log(`[convertAndSendProgram] Client User ID: ${clientUserId}`)
      console.log(`[convertAndSendProgram] Program data:`, JSON.stringify(programData, null, 2))

      const timestamp = Timestamp.now()
      const routineMap: Array<{ routineId: string; week: number; order: number }> = []

      // Handle periodized programs (with weeks array)
      if (programData.weeks && Array.isArray(programData.weeks) && programData.weeks.length > 0) {
        console.log(`[convertAndSendProgram] Processing ${programData.weeks.length} weeks (PERIODIZED)`)

        for (let weekIndex = 0; weekIndex < programData.weeks.length; weekIndex++) {
          const week = programData.weeks[weekIndex]
          const weekNumber = week.week_number || weekIndex + 1

          console.log(`[convertAndSendProgram] Processing week ${weekNumber} (index ${weekIndex})`)

          if (week.routines && Array.isArray(week.routines)) {
            console.log(`[convertAndSendProgram] Week ${weekNumber} has ${week.routines.length} routines`)

            for (let routineIndex = 0; routineIndex < week.routines.length; routineIndex++) {
              const routine = week.routines[routineIndex]

              try {
                console.log(`[convertAndSendProgram] Creating routine ${routineIndex + 1} for week ${weekNumber}`)
                const { routineId } = await this.createRoutine(clientUserId, routine, weekNumber, routineIndex)

                routineMap.push({
                  routineId,
                  week: weekNumber,
                  order: routineIndex + 1,
                })

                console.log(
                  `[convertAndSendProgram] ✅ Added routine ${routineId} to week ${weekNumber}, order ${routineIndex + 1}`,
                )
              } catch (routineError) {
                console.error(
                  `[convertAndSendProgram] Error creating routine ${routineIndex + 1} for week ${weekNumber}:`,
                  routineError,
                )
                // CRITICAL: Don't skip routines, create empty ones instead
                console.log(`[convertAndSendProgram] Creating empty routine as fallback...`)
                try {
                  const { routineId } = await this.createRoutine(
                    clientUserId,
                    { exercises: [] },
                    weekNumber,
                    routineIndex,
                  )
                  routineMap.push({
                    routineId,
                    week: weekNumber,
                    order: routineIndex + 1,
                  })
                  console.log(`[convertAndSendProgram] ✅ Created fallback routine ${routineId}`)
                } catch (fallbackError) {
                  console.error(`[convertAndSendProgram] Failed to create fallback routine:`, fallbackError)
                }
              }
            }
          } else {
            console.log(`[convertAndSendProgram] ⚠️ Week ${weekNumber} has no routines or routines is not an array`)
          }
        }
      }
      // Handle non-periodized programs (direct routines array)
      else if (programData.routines && Array.isArray(programData.routines) && programData.routines.length > 0) {
        console.log(`[convertAndSendProgram] Processing ${programData.routines.length} routines (NON-PERIODIZED)`)

        // For non-periodized, repeat the same routines for each week
        const totalWeeks = programData.program_weeks || programData.duration_weeks || 1

        console.log(`[convertAndSendProgram] Will create routines for ${totalWeeks} weeks`)

        for (let week = 1; week <= totalWeeks; week++) {
          console.log(`[convertAndSendProgram] Creating routines for week ${week}`)

          for (let routineIndex = 0; routineIndex < programData.routines.length; routineIndex++) {
            const routine = programData.routines[routineIndex]

            try {
              console.log(`[convertAndSendProgram] Creating routine ${routineIndex + 1} for week ${week}`)
              const { routineId } = await this.createRoutine(clientUserId, routine, week, routineIndex)

              routineMap.push({
                routineId,
                week,
                order: routineIndex + 1,
              })

              console.log(
                `[convertAndSendProgram] ✅ Added routine ${routineId} to week ${week}, order ${routineIndex + 1}`,
              )
            } catch (routineError) {
              console.error(
                `[convertAndSendProgram] Error creating routine ${routineIndex + 1} for week ${week}:`,
                routineError,
              )
              // CRITICAL: Don't skip routines, create empty ones instead
              console.log(`[convertAndSendProgram] Creating empty routine as fallback...`)
              try {
                const { routineId } = await this.createRoutine(clientUserId, { exercises: [] }, week, routineIndex)
                routineMap.push({
                  routineId,
                  week,
                  order: routineIndex + 1,
                })
                console.log(`[convertAndSendProgram] ✅ Created fallback routine ${routineId}`)
              } catch (fallbackError) {
                console.error(`[convertAndSendProgram] Failed to create fallback routine:`, fallbackError)
              }
            }
          }
        }
      } else {
        console.log(`[convertAndSendProgram] ❌ No valid program structure found`)
        console.log(`[convertAndSendProgram] Program structure analysis:`, {
          hasWeeks: !!programData.weeks,
          weeksLength: programData.weeks?.length || 0,
          hasRoutines: !!programData.routines,
          routinesLength: programData.routines?.length || 0,
          isPeriodized: programData.is_periodized,
        })
        throw new Error("Program must have either weeks array with routines or routines array")
      }

      console.log(`[convertAndSendProgram] Total routines created: ${routineMap.length}`)
      console.log(`[convertAndSendProgram] Routine map:`, routineMap)

      // CRITICAL FIX: Don't fail if no routines, create a default program structure
      if (routineMap.length === 0) {
        console.log(`[convertAndSendProgram] No routines were created, creating default empty routine...`)
        try {
          const { routineId } = await this.createRoutine(clientUserId, { exercises: [] }, 1, 0)
          routineMap.push({
            routineId,
            week: 1,
            order: 1,
          })
          console.log(`[convertAndSendProgram] ✅ Created default routine ${routineId}`)
        } catch (defaultError) {
          console.error(`[convertAndSendProgram] Failed to create default routine:`, defaultError)
          throw new Error("No routines were created for the program and failed to create default routine")
        }
      }

      // Create the program document
      const programId = uuidv4()

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

      console.log(`[convertAndSendProgram] Program document to create:`, {
        id: program.id,
        name: program.name,
        duration: program.duration,
        routinesCount: program.routines.length,
      })

      // Clean the program document
      const cleanProgram = this.removeUndefinedValues(program)

      // Save program to Firestore
      const programsRef = collection(db, "users", clientUserId, "programs")
      const programDocRef = doc(programsRef, programId)

      console.log(`[convertAndSendProgram] Saving program to: users/${clientUserId}/programs/${programId}`)
      await setDoc(programDocRef, cleanProgram)

      console.log(`[convertAndSendProgram] ✅ Successfully created program: ${program.name} with ID: ${programId}`)

      // Verification: Check that the program was saved correctly
      const savedProgramDoc = await getDoc(programDocRef)
      if (savedProgramDoc.exists()) {
        const savedData = savedProgramDoc.data()
        console.log(`[convertAndSendProgram] ✅ VERIFICATION: Program saved successfully with routines:`, {
          id: savedData.id,
          name: savedData.name,
          routinesCount: savedData.routines?.length || 0,
        })
      } else {
        console.log(`[convertAndSendProgram] ❌ VERIFICATION FAILED: Program document not found after save`)
      }

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
      console.log(`[getClientUserId] Getting userId for client ${clientId} of trainer ${trainerId}`)

      const clientDoc = await getDoc(doc(db, "users", trainerId, "clients", clientId))
      if (clientDoc.exists()) {
        const clientData = clientDoc.data()
        const userId = clientData.userId || null

        console.log(`[getClientUserId] Found userId: ${userId}`)

        if (userId) {
          const userDoc = await getDoc(doc(db, "users", userId))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            console.log(`[getClientUserId] User document exists with status: ${userData.status}`)
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
      console.log(`[sendProgramToClient] === STARTING PROGRAM SEND PROCESS ===`)
      console.log(`[sendProgramToClient] Client ID: ${clientId}`)
      console.log(`[sendProgramToClient] Program: ${programData.name || programData.program_title}`)

      // Get the client's userId from the trainer's client document
      const trainerId = "5tVdK6LXCifZgjxD7rml3nEOXmh1" // This should come from auth context

      const clientUserId = await this.getClientUserId(trainerId, clientId)

      if (!clientUserId) {
        throw new Error("Client not found or client does not have a linked user account")
      }

      console.log(`[sendProgramToClient] Client user ID: ${clientUserId}`)

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
