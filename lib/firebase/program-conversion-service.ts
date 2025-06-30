import { collection, doc, addDoc, getDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import type { WorkoutProgram } from "@/types/workout-program"
import { v4 as uuidv4 } from "uuid"

// Types matching your mobile app structure
interface MobileExercise {
  id: string
  name: string
  description?: string
  instructions?: string
  muscleGroups: string[]
  equipment?: string[]
  difficulty?: string
  videoUrl?: string
  imageUrl?: string
  createdAt: any
  updatedAt: any
  createdBy: string
  isGlobal: boolean
}

interface MobileSet {
  setNumber: number
  reps?: string
  weight?: string
  duration?: string
  distance?: string
  rpe?: string
  restTime?: string
  notes?: string
  isWarmup: boolean
}

interface MobileWorkoutExercise {
  exerciseId: string
  exerciseName: string
  sets: MobileSet[]
  notes?: string
  restBetweenSets?: string
}

interface MobileRoutine {
  id: string
  name: string
  description?: string
  exercises: MobileWorkoutExercise[]
  estimatedDuration?: number
  difficulty?: string
  type: "program" // Always "program" for converted programs
  createdAt: any
  updatedAt: any
  createdBy: string
  isTemplate: boolean
}

interface MobileProgram {
  id: string
  title: string
  description?: string
  routineIds: string[]
  weeks: number
  isActive: boolean
  startDate?: any
  endDate?: any
  createdAt: any
  updatedAt: any
  createdBy: string
  clientId: string
  message?: string
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
    const timestamp = serverTimestamp()

    const exerciseDoc: MobileExercise = {
      id: exerciseId,
      name: exerciseName,
      description: `Exercise imported from program: ${exerciseName}`,
      muscleGroups: [], // Could be enhanced to parse muscle groups from name
      equipment: [],
      difficulty: "intermediate",
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: userId,
      isGlobal: false,
    }

    await addDoc(userExercisesRef, exerciseDoc)
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
    const timestamp = serverTimestamp()

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
          setNumber: set.set_number || 1,
          reps: set.reps?.toString() || "",
          weight: set.weight?.toString() || "",
          duration: set.duration?.toString() || "",
          distance: set.distance?.toString() || "",
          rpe: set.rpe?.toString() || "",
          restTime: set.rest?.toString() || "",
          notes: notesParts.join(" | ") || undefined,
          isWarmup: set.warmup || false,
        }
      })

      exercises.push({
        exerciseId,
        exerciseName: exercise.name,
        sets: mobileSets,
        notes: exercise.notes || "",
        restBetweenSets: exercise.restBetweenSets || "",
      })
    }

    const routineDoc: MobileRoutine = {
      id: routineId,
      name: routineData.routine_name,
      description: `Week ${weekNumber} routine from program: ${routineData.program_title}`,
      exercises,
      estimatedDuration: this.estimateRoutineDuration(exercises),
      difficulty: "intermediate",
      type: "program", // This is the key flag for mobile app filtering
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: userId,
      isTemplate: false,
    }

    // Save routine to Firestore
    const routinesRef = collection(db, "users", userId, "routines")
    await addDoc(routinesRef, routineDoc)

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

      const timestamp = serverTimestamp()
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
        title: programData.program_title || programData.title || programData.name || "Imported Program",
        description: programData.program_notes || `Program imported from trainer. ${programData.message || ""}`.trim(),
        routineIds: routineMap.map((r) => r.routineId),
        weeks: programData.program_weeks || routineMap.length,
        isActive: true,
        startDate: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
        createdBy: clientUserId,
        clientId: clientUserId, // In mobile app, this is the user's ID
        message: programData.message || "",
      }

      // Save program to Firestore
      const programsRef = collection(db, "users", clientUserId, "programs")
      await addDoc(programsRef, program)

      console.log(`[convertAndSendProgram] ✅ Created program: ${program.title} with ID: ${programId}`)
      console.log(`[convertAndSendProgram] Program structure:`, {
        totalRoutines: routineMap.length,
        weeks: program.weeks,
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

  /**
   * Convert a workout program to mobile app format and send to client
   */
  async convertAndSendProgram(
    programData: WorkoutProgram,
    clientId: string,
    trainerId: string,
    message?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`[ProgramConversionService] Converting program "${programData.program_title}" for client ${clientId}`)

      // 1. Get client information to get their userId
      const clientDoc = await getDoc(doc(db, "users", trainerId, "clients", clientId))
      if (!clientDoc.exists()) {
        throw new Error("Client not found")
      }

      const clientData = clientDoc.data()
      const userId = clientData.userId

      if (!userId) {
        throw new Error("Client does not have a linked user account")
      }

      console.log(`[ProgramConversionService] Client ${clientId} has userId: ${userId}`)

      // 2. Process all exercises and create them if they don't exist
      const exerciseIds = await this.processExercises(programData, trainerId, userId)
      console.log(`[ProgramConversionService] Processed ${exerciseIds.size} unique exercises`)

      // 3. Create routines for each week/routine combination
      const routineIds = await this.createRoutines(programData, exerciseIds, trainerId, userId)
      console.log(`[ProgramConversionService] Created ${routineIds.length} routines`)

      // 4. Create the program document
      const programId = await this.createProgram(programData, routineIds, trainerId, userId, message)
      console.log(`[ProgramConversionService] Created program with ID: ${programId}`)

      return { success: true }
    } catch (error) {
      console.error("[ProgramConversionService] Error converting program:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }

  /**
   * Process all exercises in the program and ensure they exist in the database
   */
  private async processExercises(
    programData: WorkoutProgram,
    trainerId: string,
    userId: string,
  ): Promise<Map<string, string>> {
    const exerciseMap = new Map<string, string>() // exerciseName -> exerciseId
    const exerciseNames = new Set<string>()

    // Collect all unique exercise names from the program
    if (programData.weeks) {
      programData.weeks.forEach((week) => {
        if (week.routines) {
          week.routines.forEach((routine) => {
            if (routine.exercises) {
              routine.exercises.forEach((exercise) => {
                if (exercise.name) {
                  exerciseNames.add(exercise.name.trim())
                }
              })
            }
          })
        }
      })
    }

    console.log(`[ProgramConversionService] Found ${exerciseNames.size} unique exercises to process`)

    // Process each exercise
    for (const exerciseName of exerciseNames) {
      try {
        const exerciseId = await this.findOrCreateExercise(exerciseName, trainerId, userId)
        exerciseMap.set(exerciseName, exerciseId)
        console.log(`[ProgramConversionService] Mapped exercise "${exerciseName}" to ID: ${exerciseId}`)
      } catch (error) {
        console.error(`[ProgramConversionService] Error processing exercise "${exerciseName}":`, error)
        // Continue with other exercises even if one fails
      }
    }

    return exerciseMap
  }

  /**
   * Find an existing exercise or create a new one
   */
  private async findOrCreateExercise(exerciseName: string, trainerId: string, userId: string): Promise<string> {
    const normalizedName = exerciseName.toLowerCase().trim()

    // 1. First check global exercises
    const globalExercisesRef = collection(db, "exercises")
    const globalQuery = query(globalExercisesRef, where("name", "==", exerciseName), where("isGlobal", "==", true))

    const globalSnapshot = await getDocs(globalQuery)
    if (!globalSnapshot.empty) {
      const exerciseId = globalSnapshot.docs[0].id
      console.log(`[ProgramConversionService] Found global exercise "${exerciseName}" with ID: ${exerciseId}`)
      return exerciseId
    }

    // 2. Check user's personal exercises
    const userExercisesRef = collection(db, "users", userId, "exercises")
    const userQuery = query(userExercisesRef, where("name", "==", exerciseName))

    const userSnapshot = await getDocs(userQuery)
    if (!userSnapshot.empty) {
      const exerciseId = userSnapshot.docs[0].id
      console.log(`[ProgramConversionService] Found user exercise "${exerciseName}" with ID: ${exerciseId}`)
      return exerciseId
    }

    // 3. Create new exercise in user's collection
    console.log(`[ProgramConversionService] Creating new exercise "${exerciseName}" for user ${userId}`)

    const newExercise: Partial<MobileExercise> = {
      name: exerciseName,
      description: `Exercise imported from program: ${exerciseName}`,
      muscleGroups: [], // Could be enhanced to parse muscle groups from name
      equipment: [],
      difficulty: "intermediate",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: trainerId,
      isGlobal: false,
    }

    const exerciseRef = await addDoc(userExercisesRef, newExercise)
    console.log(`[ProgramConversionService] Created new exercise "${exerciseName}" with ID: ${exerciseRef.id}`)

    return exerciseRef.id
  }

  /**
   * Create routines for the program
   */
  private async createRoutines(
    programData: WorkoutProgram,
    exerciseMap: Map<string, string>,
    trainerId: string,
    userId: string,
  ): Promise<string[]> {
    const routineIds: string[] = []

    if (!programData.weeks) {
      console.log("[ProgramConversionService] No weeks found in program data")
      return routineIds
    }

    for (let weekIndex = 0; weekIndex < programData.weeks.length; weekIndex++) {
      const week = programData.weeks[weekIndex]

      if (!week.routines) {
        console.log(`[ProgramConversionService] No routines found for week ${weekIndex + 1}`)
        continue
      }

      for (let routineIndex = 0; routineIndex < week.routines.length; routineIndex++) {
        const routine = week.routines[routineIndex]

        try {
          const routineId = await this.createSingleRoutine(
            routine,
            exerciseMap,
            trainerId,
            userId,
            weekIndex + 1,
            routineIndex + 1,
            programData.program_title,
          )

          routineIds.push(routineId)
          console.log(
            `[ProgramConversionService] Created routine for Week ${weekIndex + 1}, Routine ${routineIndex + 1}: ${routineId}`,
          )
        } catch (error) {
          console.error(
            `[ProgramConversionService] Error creating routine for Week ${weekIndex + 1}, Routine ${routineIndex + 1}:`,
            error,
          )
          // Continue with other routines even if one fails
        }
      }
    }

    return routineIds
  }

  /**
   * Create a single routine
   */
  private async createSingleRoutine(
    routineData: any,
    exerciseMap: Map<string, string>,
    trainerId: string,
    userId: string,
    weekNumber: number,
    routineNumber: number,
    programTitle: string,
  ): Promise<string> {
    const exercises: MobileWorkoutExercise[] = []

    if (routineData.exercises) {
      for (const exercise of routineData.exercises) {
        const exerciseId = exerciseMap.get(exercise.name?.trim())

        if (!exerciseId) {
          console.warn(`[ProgramConversionService] Exercise ID not found for: ${exercise.name}`)
          continue
        }

        const sets: MobileSet[] = []

        if (exercise.sets) {
          exercise.sets.forEach((set: any, index: number) => {
            sets.push({
              setNumber: set.set_number || index + 1,
              reps: set.reps || "",
              weight: set.weight || "",
              duration: set.duration || "",
              distance: set.distance || "",
              rpe: set.rpe || "",
              restTime: set.rest || "",
              notes: set.notes || "",
              isWarmup: set.warmup || false,
            })
          })
        }

        exercises.push({
          exerciseId,
          exerciseName: exercise.name,
          sets,
          notes: exercise.notes || "",
          restBetweenSets: exercise.restBetweenSets || "",
        })
      }
    }

    const routineName =
      routineData.routine_name || `Week ${weekNumber} - ${routineData.routine_name || `Routine ${routineNumber}`}`

    const mobileRoutine: Partial<MobileRoutine> = {
      name: routineName,
      description: `Week ${weekNumber} routine from program: ${programTitle}`,
      exercises,
      estimatedDuration: this.estimateRoutineDuration(exercises),
      difficulty: "intermediate",
      type: "program", // Always "program" for converted programs
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: trainerId,
      isTemplate: false,
    }

    const routinesRef = collection(db, "users", userId, "routines")
    const routineRef = await addDoc(routinesRef, mobileRoutine)

    return routineRef.id
  }

  /**
   * Create the program document
   */
  private async createProgram(
    programData: WorkoutProgram,
    routineIds: string[],
    trainerId: string,
    userId: string,
    message?: string,
  ): Promise<string> {
    const mobileProgram: Partial<MobileProgram> = {
      title: programData.program_title || "Imported Program",
      description: programData.program_notes || `Program imported from trainer. ${message || ""}`.trim(),
      routineIds,
      weeks: programData.program_weeks || routineIds.length,
      isActive: true,
      startDate: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: trainerId,
      clientId: userId, // In mobile app, this is the user's ID
      message: message || "",
    }

    const programsRef = collection(db, "users", userId, "programs")
    const programRef = await addDoc(programsRef, mobileProgram)

    return programRef.id
  }

  /**
   * Estimate routine duration based on exercises and sets
   */
  private estimateRoutineDuration(exercises: MobileWorkoutExercise[]): number {
    let totalMinutes = 0

    exercises.forEach((exercise) => {
      // Estimate 2 minutes per set + rest time
      const setsCount = exercise.sets.length
      totalMinutes += setsCount * 2

      // Add rest time if specified
      exercise.sets.forEach((set) => {
        if (set.restTime) {
          const restMatch = set.restTime.match(/(\d+)/)
          if (restMatch) {
            totalMinutes += Number.parseInt(restMatch[1]) / 60 // Convert seconds to minutes
          }
        }
      })
    })

    // Add 5 minutes for warm-up and cool-down
    totalMinutes += 5

    return Math.max(totalMinutes, 15) // Minimum 15 minutes
  }
}

export const programConversionService = new ProgramConversionService()
