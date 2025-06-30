import { collection, doc, setDoc, getDocs, getDoc, query, where, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { v4 as uuidv4 } from "uuid"
import type { WorkoutProgram, WorkoutRoutine, ProgramExercise } from "@/types/workout-program"
import { ErrorType, createError, logError, tryCatch } from "@/lib/utils/error-handler"

// Types for mobile app format
interface MobileAppRoutine {
  id: string
  name: string
  notes: string
  createdAt: any
  updatedAt: any
  deletedAt: null
  type: "program"
  exercises: MobileAppExercise[]
}

interface MobileAppExercise {
  id: string
  name: string
  video_url?: string
  notes: string
  sets: MobileAppSet[]
}

interface MobileAppSet {
  id: string
  reps: string
  type: string
  weight: string
  notes: string
}

interface MobileAppProgram {
  id: string
  name: string
  notes: string
  program_URL?: string
  createdAt: any
  updatedAt: any
  startedAt: any
  duration: number
  routines: ProgramRoutineReference[]
}

interface ProgramRoutineReference {
  routineId: string
  week: number
  order: number
}

// Check if exercise exists globally or in user's custom exercises
async function ensureExerciseExists(exerciseName: string, userId: string): Promise<string> {
  try {
    console.log(`[ensureExerciseExists] Checking exercise: ${exerciseName} for user: ${userId}`)

    // First check global exercises collection
    const globalExercisesRef = collection(db, "exercises")
    const globalQuery = query(globalExercisesRef, where("name", "==", exerciseName))
    const [globalSnapshot, globalError] = await tryCatch(() => getDocs(globalQuery), ErrorType.DB_READ_FAILED, {
      function: "ensureExerciseExists",
      exerciseName,
      userId,
    })

    if (!globalError && globalSnapshot && !globalSnapshot.empty) {
      const exerciseId = globalSnapshot.docs[0].id
      console.log(`[ensureExerciseExists] Found global exercise: ${exerciseId}`)
      return exerciseId
    }

    // Check user's custom exercises
    const userExercisesRef = collection(db, "users", userId, "exercises")
    const userQuery = query(userExercisesRef, where("name", "==", exerciseName))
    const [userSnapshot, userError] = await tryCatch(() => getDocs(userQuery), ErrorType.DB_READ_FAILED, {
      function: "ensureExerciseExists",
      exerciseName,
      userId,
    })

    if (!userError && userSnapshot && !userSnapshot.empty) {
      const exerciseId = userSnapshot.docs[0].id
      console.log(`[ensureExerciseExists] Found user exercise: ${exerciseId}`)
      return exerciseId
    }

    // Exercise doesn't exist, create it in user's custom exercises
    console.log(`[ensureExerciseExists] Creating new exercise: ${exerciseName}`)
    const exerciseId = uuidv4()
    const exerciseDoc = {
      id: exerciseId,
      name: exerciseName,
      muscleGroup: "Other",
      isCardio: false,
      isFullBody: false,
      isMobility: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deletedAt: null,
    }

    const [, createError] = await tryCatch(
      () => setDoc(doc(userExercisesRef, exerciseId), exerciseDoc),
      ErrorType.DB_WRITE_FAILED,
      {
        function: "ensureExerciseExists",
        exerciseName,
        userId,
        exerciseId,
      },
    )

    if (createError) {
      throw createError
    }

    console.log(`[ensureExerciseExists] Created new exercise: ${exerciseId}`)
    return exerciseId
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "ensureExerciseExists", exerciseName, userId },
      "Failed to ensure exercise exists",
    )
    logError(appError)
    throw appError
  }
}

// Convert PT program exercise to mobile app format
async function convertExerciseToMobileFormat(
  exercise: ProgramExercise,
  userId: string,
  weekNumber: number,
): Promise<MobileAppExercise> {
  try {
    // Ensure the exercise exists and get its ID
    const exerciseId = await ensureExerciseExists(exercise.name, userId)

    // Get the sets for the specific week
    const weekData = exercise.weeks.find((w) => w.week_number === weekNumber)
    const sets: MobileAppSet[] = []

    if (weekData && weekData.sets) {
      for (const set of weekData.sets) {
        const rpe = set.rpe ? `RPE: ${set.rpe}` : ""
        const rest = set.rest ? `Rest: ${set.rest}` : ""
        const notes = [rpe, rest].filter(Boolean).join(" | ")

        sets.push({
          id: uuidv4(),
          reps: set.reps?.toString() || "",
          type: set.warmup ? "warmup" : "normal",
          weight: set.weight?.toString() || "",
          notes: notes || set.notes || "",
        })
      }
    }

    return {
      id: exerciseId,
      name: exercise.name,
      video_url: exercise.exercise_video || undefined,
      notes: exercise.notes || "",
      sets,
    }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "convertExerciseToMobileFormat", exerciseName: exercise.name, userId, weekNumber },
      "Failed to convert exercise to mobile format",
    )
    logError(appError)
    throw appError
  }
}

// Convert PT routine to mobile app format
async function convertRoutineToMobileFormat(
  routine: WorkoutRoutine,
  userId: string,
  weekNumber: number,
): Promise<MobileAppRoutine> {
  try {
    console.log(`[convertRoutineToMobileFormat] Converting routine: ${routine.routine_name} for week ${weekNumber}`)

    const routineId = uuidv4()
    const exercises: MobileAppExercise[] = []

    // Convert each exercise
    for (const exercise of routine.exercises) {
      const mobileExercise = await convertExerciseToMobileFormat(exercise, userId, weekNumber)
      exercises.push(mobileExercise)
    }

    return {
      id: routineId,
      name: routine.routine_name,
      notes: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deletedAt: null,
      type: "program",
      exercises,
    }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "convertRoutineToMobileFormat", routineName: routine.routine_name, userId, weekNumber },
      "Failed to convert routine to mobile format",
    )
    logError(appError)
    throw appError
  }
}

// Main function to convert and send program to client
export async function convertAndSendProgramToClient(
  program: WorkoutProgram,
  clientUserId: string,
  message?: string,
): Promise<{ success: boolean; programId?: string; error?: any }> {
  try {
    console.log(
      `[convertAndSendProgramToClient] Converting program: ${program.program_title} for client: ${clientUserId}`,
    )

    if (!program || !clientUserId) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "convertAndSendProgramToClient" },
        "Program and client user ID are required",
      )
      logError(error)
      return { success: false, error }
    }

    const routineReferences: ProgramRoutineReference[] = []
    const routinesRef = collection(db, "users", clientUserId, "routines")

    // Process each week and routine
    if (program.is_periodized && program.weeks) {
      // Periodized program - process each week
      for (const week of program.weeks) {
        if (week.routines) {
          for (let routineIndex = 0; routineIndex < week.routines.length; routineIndex++) {
            const routine = week.routines[routineIndex]
            const mobileRoutine = await convertRoutineToMobileFormat(routine, clientUserId, week.week_number)

            // Save routine to Firestore
            const [, routineError] = await tryCatch(
              () => setDoc(doc(routinesRef, mobileRoutine.id), mobileRoutine),
              ErrorType.DB_WRITE_FAILED,
              {
                function: "convertAndSendProgramToClient",
                routineId: mobileRoutine.id,
                clientUserId,
              },
            )

            if (routineError) {
              return { success: false, error: routineError }
            }

            // Add to routine references
            routineReferences.push({
              routineId: mobileRoutine.id,
              week: week.week_number,
              order: routineIndex + 1,
            })

            console.log(
              `[convertAndSendProgramToClient] Created routine: ${mobileRoutine.name} (Week ${week.week_number})`,
            )
          }
        }
      }
    } else {
      // Non-periodized program - single week repeated
      const singleWeek = program.weeks?.[0] || { routines: program.routines || [] }

      if (singleWeek.routines) {
        for (let routineIndex = 0; routineIndex < singleWeek.routines.length; routineIndex++) {
          const routine = singleWeek.routines[routineIndex]

          // For non-periodized, repeat the same routines for each week
          for (let week = 1; week <= program.program_weeks; week++) {
            const mobileRoutine = await convertRoutineToMobileFormat(routine, clientUserId, 1) // Always use week 1 data

            // Save routine to Firestore
            const [, routineError] = await tryCatch(
              () => setDoc(doc(routinesRef, mobileRoutine.id), mobileRoutine),
              ErrorType.DB_WRITE_FAILED,
              {
                function: "convertAndSendProgramToClient",
                routineId: mobileRoutine.id,
                clientUserId,
              },
            )

            if (routineError) {
              return { success: false, error: routineError }
            }

            // Add to routine references
            routineReferences.push({
              routineId: mobileRoutine.id,
              week: week,
              order: routineIndex + 1,
            })

            console.log(`[convertAndSendProgramToClient] Created routine: ${mobileRoutine.name} (Week ${week})`)
          }
        }
      }
    }

    // Create the program document
    const programId = uuidv4()
    const mobileProgram: MobileAppProgram = {
      id: programId,
      name: program.program_title,
      notes: program.program_notes || "",
      program_URL: program.program_URL || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      startedAt: serverTimestamp(),
      duration: program.program_weeks,
      routines: routineReferences,
    }

    // Save program to Firestore
    const programsRef = collection(db, "users", clientUserId, "programs")
    const [, programError] = await tryCatch(
      () => setDoc(doc(programsRef, programId), mobileProgram),
      ErrorType.DB_WRITE_FAILED,
      {
        function: "convertAndSendProgramToClient",
        programId,
        clientUserId,
      },
    )

    if (programError) {
      return { success: false, error: programError }
    }

    console.log(
      `[convertAndSendProgramToClient] Created program: ${mobileProgram.name} with ${routineReferences.length} routine references`,
    )

    // TODO: Send notification to client about new program
    // This could be implemented later with push notifications or email

    return { success: true, programId }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "convertAndSendProgramToClient", clientUserId },
      "Failed to convert and send program to client",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}

// Get client's user ID from trainer's client document
export async function getClientUserId(trainerId: string, clientId: string): Promise<string | null> {
  try {
    console.log(`[getClientUserId] Getting user ID for client: ${clientId} (trainer: ${trainerId})`)

    if (!trainerId || !clientId) {
      console.error("[getClientUserId] Trainer ID and client ID are required")
      return null
    }

    const clientRef = doc(db, "users", trainerId, "clients", clientId)
    const [clientDoc, error] = await tryCatch(() => getDoc(clientRef), ErrorType.DB_READ_FAILED, {
      function: "getClientUserId",
      trainerId,
      clientId,
    })

    if (error || !clientDoc) {
      console.error("[getClientUserId] Error fetching client document:", error)
      return null
    }

    if (!clientDoc.exists()) {
      console.error("[getClientUserId] Client document not found")
      return null
    }

    const clientData = clientDoc.data()
    const userId = clientData.userId

    if (!userId) {
      console.error("[getClientUserId] Client document does not contain userId")
      return null
    }

    console.log(`[getClientUserId] Found user ID: ${userId}`)
    return userId
  } catch (error) {
    console.error("[getClientUserId] Unexpected error:", error)
    return null
  }
}
