import { db } from "./firebase"
import { collection, doc, setDoc, getDoc, getDocs, Timestamp } from "firebase/firestore"
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
  name?: string
  id?: string // Handle both name and id fields
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
   * OPTIMIZED: Batch check exercises to reduce Firebase calls
   */
  private async ensureExercisesExist(userId: string, exerciseNames: string[]): Promise<Map<string, string>> {
    console.log(`[ensureExercisesExist] Checking ${exerciseNames.length} exercises for user: ${userId}`)

    const exerciseMap = new Map<string, string>()
    const uniqueNames = [...new Set(exerciseNames.filter((name) => name && name.trim()))]

    if (uniqueNames.length === 0) {
      return exerciseMap
    }

    try {
      // Batch check global exercises
      const globalExercisesRef = collection(db, "exercises")
      const globalSnapshot = await getDocs(globalExercisesRef)

      globalSnapshot.docs.forEach((doc) => {
        const data = doc.data()
        if (data.name && uniqueNames.includes(data.name)) {
          exerciseMap.set(data.name, doc.id)
        }
      })

      // Check remaining exercises in user's collection
      const remainingNames = uniqueNames.filter((name) => !exerciseMap.has(name))

      if (remainingNames.length > 0) {
        const userExercisesRef = collection(db, "users", userId, "exercises")
        const userSnapshot = await getDocs(userExercisesRef)

        userSnapshot.docs.forEach((doc) => {
          const data = doc.data()
          if (data.name && remainingNames.includes(data.name)) {
            exerciseMap.set(data.name, doc.id)
          }
        })
      }

      // Create missing exercises in batch
      const missingNames = uniqueNames.filter((name) => !exerciseMap.has(name))

      if (missingNames.length > 0) {
        console.log(`[ensureExercisesExist] Creating ${missingNames.length} missing exercises`)

        const timestamp = Timestamp.now()
        const userExercisesRef = collection(db, "users", userId, "exercises")

        // Create exercises in parallel but limit concurrency
        const batchSize = 5
        for (let i = 0; i < missingNames.length; i += batchSize) {
          const batch = missingNames.slice(i, i + batchSize)

          await Promise.all(
            batch.map(async (exerciseName) => {
              const exerciseId = uuidv4()

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
              exerciseMap.set(exerciseName, exerciseId)
            }),
          )
        }
      }

      console.log(`[ensureExercisesExist] ✅ Processed ${exerciseMap.size} exercises`)
      return exerciseMap
    } catch (error) {
      console.error(`[ensureExercisesExist] Error processing exercises:`, error)
      throw error
    }
  }

  /**
   * Generate a meaningful routine name based on available data
   */
  private generateRoutineName(routineData: any, weekNumber: number, routineIndex = 0): string {
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
        .filter((ex) => ex && (ex.name || ex.id) && typeof (ex.name || ex.id) === "string")
        .map((ex) => (ex.name || ex.id).trim())
        .slice(0, 2)

      if (exerciseNames.length > 0) {
        const exercisesPart = exerciseNames.join(" + ")
        return `Week ${weekNumber} - ${exercisesPart}${exerciseNames.length < routineData.exercises.length ? " +more" : ""}`
      }
    }

    // Strategy 4: Generic fallback
    return `Week ${weekNumber} - Workout ${routineIndex + 1}`
  }

  /**
   * Creates a routine document in the user's routines collection
   * OPTIMIZED: Use pre-fetched exercise map to avoid individual lookups
   */
  private async createRoutine(
    userId: string,
    routineData: any,
    weekNumber: number,
    routineIndex = 0,
    exerciseMap: Map<string, string>,
  ): Promise<{ routineId: string; routineDoc: MobileRoutine }> {
    const routineId = uuidv4()
    const timestamp = Timestamp.now()

    console.log(`[createRoutine] Creating routine ${routineIndex + 1} for week ${weekNumber}`)

    // Validate routine data
    if (!routineData) {
      routineData = { exercises: [] }
    }

    // Generate routine name
    const routineName = this.generateRoutineName(routineData, weekNumber, routineIndex)

    // Process exercises
    const exercises = []
    const exercisesArray = routineData.exercises || []

    if (Array.isArray(exercisesArray) && exercisesArray.length > 0) {
      for (const exercise of exercisesArray) {
        // FIXED: Handle both 'name' and 'id' fields
        const exerciseName = exercise.name || exercise.id

        if (!exerciseName || typeof exerciseName !== "string" || exerciseName.trim() === "") {
          console.log(`[createRoutine] Skipping exercise with invalid name/id:`, exercise)
          continue
        }

        const exerciseId = exerciseMap.get(exerciseName.trim())
        if (!exerciseId) {
          console.log(`[createRoutine] Exercise not found in map: ${exerciseName}`)
          continue
        }

        // Process sets for this exercise
        let sets = exercise.sets || []

        // If no sets provided, create default sets
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

          // Only add notes if they exist
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
          name: exerciseName.trim(),
          sets: mobileSets,
        })
      }
    }

    // Create routine document
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

    // Clean and save routine
    const cleanRoutineDoc = this.removeUndefinedValues(routineDoc)
    const routinesRef = collection(db, "users", userId, "routines")
    const routineDocRef = doc(routinesRef, routineId)

    await setDoc(routineDocRef, cleanRoutineDoc)

    console.log(`[createRoutine] ✅ Created routine: "${routineName}" with ${exercises.length} exercises`)

    return { routineId, routineDoc: cleanRoutineDoc }
  }

  /**
   * Recursively remove undefined values from an object
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
   * OPTIMIZED: Batch operations and reduce Firebase calls
   */
  async convertAndSendProgram(programData: any, clientUserId: string): Promise<string> {
    try {
      console.log(`[convertAndSendProgram] === STARTING OPTIMIZED PROGRAM CONVERSION ===`)
      console.log(`[convertAndSendProgram] Client User ID: ${clientUserId}`)

      const timestamp = Timestamp.now()
      const routineMap: Array<{ routineId: string; week: number; order: number }> = []

      // OPTIMIZATION: Collect all exercise names first for batch processing
      const allExerciseNames: string[] = []

      if (programData.weeks && Array.isArray(programData.weeks)) {
        programData.weeks.forEach((week: any) => {
          if (week.routines && Array.isArray(week.routines)) {
            week.routines.forEach((routine: any) => {
              if (routine.exercises && Array.isArray(routine.exercises)) {
                routine.exercises.forEach((exercise: any) => {
                  const exerciseName = exercise.name || exercise.id
                  if (exerciseName && typeof exerciseName === "string") {
                    allExerciseNames.push(exerciseName.trim())
                  }
                })
              }
            })
          }
        })
      } else if (programData.routines && Array.isArray(programData.routines)) {
        programData.routines.forEach((routine: any) => {
          if (routine.exercises && Array.isArray(routine.exercises)) {
            routine.exercises.forEach((exercise: any) => {
              const exerciseName = exercise.name || exercise.id
              if (exerciseName && typeof exerciseName === "string") {
                allExerciseNames.push(exerciseName.trim())
              }
            })
          }
        })
      }

      // Batch process all exercises
      const exerciseMap = await this.ensureExercisesExist(clientUserId, allExerciseNames)

      // Handle periodized programs
      if (programData.weeks && Array.isArray(programData.weeks) && programData.weeks.length > 0) {
        console.log(`[convertAndSendProgram] Processing ${programData.weeks.length} weeks (PERIODIZED)`)

        for (let weekIndex = 0; weekIndex < programData.weeks.length; weekIndex++) {
          const week = programData.weeks[weekIndex]
          const weekNumber = week.week_number || weekIndex + 1

          if (week.routines && Array.isArray(week.routines)) {
            for (let routineIndex = 0; routineIndex < week.routines.length; routineIndex++) {
              const routine = week.routines[routineIndex]

              try {
                const { routineId } = await this.createRoutine(
                  clientUserId,
                  routine,
                  weekNumber,
                  routineIndex,
                  exerciseMap,
                )

                routineMap.push({
                  routineId,
                  week: weekNumber,
                  order: routineIndex + 1,
                })
              } catch (routineError) {
                console.error(`[convertAndSendProgram] Error creating routine:`, routineError)
                // Create empty fallback routine
                const { routineId } = await this.createRoutine(
                  clientUserId,
                  { exercises: [] },
                  weekNumber,
                  routineIndex,
                  exerciseMap,
                )
                routineMap.push({
                  routineId,
                  week: weekNumber,
                  order: routineIndex + 1,
                })
              }
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

            try {
              const { routineId } = await this.createRoutine(clientUserId, routine, week, routineIndex, exerciseMap)

              routineMap.push({
                routineId,
                week,
                order: routineIndex + 1,
              })
            } catch (routineError) {
              console.error(`[convertAndSendProgram] Error creating routine:`, routineError)
              // Create empty fallback routine
              const { routineId } = await this.createRoutine(
                clientUserId,
                { exercises: [] },
                week,
                routineIndex,
                exerciseMap,
              )
              routineMap.push({
                routineId,
                week,
                order: routineIndex + 1,
              })
            }
          }
        }
      } else {
        throw new Error("Program must have either weeks array with routines or routines array")
      }

      console.log(`[convertAndSendProgram] Total routines created: ${routineMap.length}`)

      if (routineMap.length === 0) {
        // Create default routine as fallback
        const { routineId } = await this.createRoutine(clientUserId, { exercises: [] }, 1, 0, exerciseMap)
        routineMap.push({
          routineId,
          week: 1,
          order: 1,
        })
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

      // Clean and save program
      const cleanProgram = this.removeUndefinedValues(program)
      const programsRef = collection(db, "users", clientUserId, "programs")
      const programDocRef = doc(programsRef, programId)

      await setDoc(programDocRef, cleanProgram)

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
