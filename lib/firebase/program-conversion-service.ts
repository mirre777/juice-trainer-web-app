import { collection, doc, setDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { v4 as uuidv4 } from "uuid"
import type { WorkoutProgram, WorkoutRoutine, ProgramExercise } from "@/types/workout-program"
import { ErrorType, createError, logError, tryCatch } from "@/lib/utils/error-handler"

// Types for mobile app format
interface MobileAppProgram {
  id: string
  name: string
  notes: string | null
  startedAt: string
  duration: number
  createdAt: string
  updated_at: string
  routines: {
    routineId: string
    week: number
    order: number
  }[]
}

interface MobileAppRoutine {
  id: string
  name: string
  notes: string
  createdAt: string
  updatedAt: string
  deletedAt: null
  type: "program"
  exercises: {
    id: string
    name: string
    sets: {
      id: string
      type: string
      weight: string
      reps: string | number
      notes?: string
    }[]
  }[]
}

interface MobileAppExercise {
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

// Check if exercise exists in global or user collection
async function ensureExerciseExists(exerciseName: string, userId: string): Promise<string> {
  try {
    // First check global exercises collection
    const globalExercisesRef = collection(db, "exercises")
    const globalQuery = query(globalExercisesRef, where("name", "==", exerciseName))
    const [globalSnapshot, globalError] = await tryCatch(() => getDocs(globalQuery), ErrorType.DB_READ_FAILED, {
      function: "ensureExerciseExists",
      exerciseName,
      collection: "global",
    })

    if (!globalError && globalSnapshot && !globalSnapshot.empty) {
      return globalSnapshot.docs[0].id
    }

    // Check user's custom exercises collection
    const userExercisesRef = collection(db, "users", userId, "exercises")
    const userQuery = query(userExercisesRef, where("name", "==", exerciseName))
    const [userSnapshot, userError] = await tryCatch(() => getDocs(userQuery), ErrorType.DB_READ_FAILED, {
      function: "ensureExerciseExists",
      exerciseName,
      collection: "user",
    })

    if (!userError && userSnapshot && !userSnapshot.empty) {
      return userSnapshot.docs[0].id
    }

    // Exercise doesn't exist, create it in user's collection
    const exerciseId = uuidv4()
    const exerciseDoc: MobileAppExercise = {
      id: exerciseId,
      name: exerciseName,
      muscleGroup: "Other", // Default muscle group
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
      { function: "ensureExerciseExists", exerciseName, userId },
    )

    if (createError) {
      throw createError
    }

    console.log(`✅ Created new exercise: ${exerciseName}`)
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
  weekNumber: number,
  userId: string,
): Promise<{ id: string; name: string; sets: any[] }> {
  try {
    const exerciseId = await ensureExerciseExists(exercise.name, userId)

    // Get the sets for the specific week
    const weekData = exercise.weeks.find((w) => w.week_number === weekNumber)
    const sets = weekData?.sets || []

    const mobileSets = sets.map((set) => ({
      id: uuidv4(),
      type: set.warmup ? "warmup" : "normal",
      weight: set.weight?.toString() || "",
      reps: set.reps || "",
      notes: [set.rpe ? `RPE: ${set.rpe}` : "", set.rest ? `Rest: ${set.rest}` : "", set.notes || ""]
        .filter(Boolean)
        .join(" | "),
    }))

    return {
      id: exerciseId,
      name: exercise.name,
      sets: mobileSets,
    }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "convertExerciseToMobileFormat", exerciseName: exercise.name, weekNumber, userId },
      "Failed to convert exercise to mobile format",
    )
    logError(appError)
    throw appError
  }
}

// Convert PT routine to mobile app format
async function convertRoutineToMobileFormat(
  routine: WorkoutRoutine,
  weekNumber: number,
  userId: string,
): Promise<{ routineId: string; routineDoc: MobileAppRoutine }> {
  try {
    const routineId = uuidv4()
    const timestamp = new Date().toISOString()

    const mobileExercises = []
    for (const exercise of routine.exercises) {
      const mobileExercise = await convertExerciseToMobileFormat(exercise, weekNumber, userId)
      mobileExercises.push(mobileExercise)
    }

    const routineDoc: MobileAppRoutine = {
      id: routineId,
      name: routine.routine_name,
      notes: "",
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
      type: "program",
      exercises: mobileExercises,
    }

    return { routineId, routineDoc }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "convertRoutineToMobileFormat", routineName: routine.routine_name, weekNumber, userId },
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
    console.log(`[program-conversion] Converting program "${program.program_title}" for client: ${clientUserId}`)

    if (!clientUserId) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "convertAndSendProgramToClient" },
        "Client user ID is required",
      )
      logError(error)
      return { success: false, error }
    }

    const routineMap: { routineId: string; week: number; order: number }[] = []
    const routinesRef = collection(db, "users", clientUserId, "routines")

    // Process each week and routine
    if (program.is_periodized && program.weeks) {
      // Periodized program - process each week
      for (const week of program.weeks) {
        const weekNumber = week.week_number

        if (week.routines) {
          for (let routineIndex = 0; routineIndex < week.routines.length; routineIndex++) {
            const routine = week.routines[routineIndex]

            const { routineId, routineDoc } = await convertRoutineToMobileFormat(routine, weekNumber, clientUserId)

            // Save routine to Firestore
            const [, routineError] = await tryCatch(
              () => setDoc(doc(routinesRef, routineId), routineDoc),
              ErrorType.DB_WRITE_FAILED,
              { function: "convertAndSendProgramToClient", routineId, weekNumber },
            )

            if (routineError) {
              return { success: false, error: routineError }
            }

            routineMap.push({
              routineId,
              week: weekNumber,
              order: routineIndex + 1,
            })

            console.log(`✅ Created routine: ${routine.routine_name} (Week ${weekNumber})`)
          }
        }
      }
    } else {
      // Non-periodized program - single week repeated
      const singleWeek = program.weeks?.[0] || { routines: program.routines || [] }

      for (let week = 1; week <= program.program_weeks; week++) {
        if (singleWeek.routines) {
          for (let routineIndex = 0; routineIndex < singleWeek.routines.length; routineIndex++) {
            const routine = singleWeek.routines[routineIndex]

            const { routineId, routineDoc } = await convertRoutineToMobileFormat(
              routine,
              1, // Use week 1 data for all weeks in non-periodized
              clientUserId,
            )

            // Save routine to Firestore
            const [, routineError] = await tryCatch(
              () => setDoc(doc(routinesRef, routineId), routineDoc),
              ErrorType.DB_WRITE_FAILED,
              { function: "convertAndSendProgramToClient", routineId, week },
            )

            if (routineError) {
              return { success: false, error: routineError }
            }

            routineMap.push({
              routineId,
              week,
              order: routineIndex + 1,
            })

            console.log(`✅ Created routine: ${routine.routine_name} (Week ${week})`)
          }
        }
      }
    }

    // Create the program document
    const programId = uuidv4()
    const timestamp = new Date().toISOString()

    const programDoc: MobileAppProgram = {
      id: programId,
      name: program.program_title,
      notes: program.program_notes || null,
      startedAt: timestamp,
      duration: program.program_weeks,
      createdAt: timestamp,
      updated_at: timestamp,
      routines: routineMap,
    }

    // Save program to Firestore
    const programsRef = collection(db, "users", clientUserId, "programs")
    const [, programError] = await tryCatch(
      () => setDoc(doc(programsRef, programId), programDoc),
      ErrorType.DB_WRITE_FAILED,
      { function: "convertAndSendProgramToClient", programId },
    )

    if (programError) {
      return { success: false, error: programError }
    }

    console.log(`✅ Created program: ${program.program_title}`)

    // TODO: Send notification to client (email/push notification)
    // This would be implemented based on your notification system

    return {
      success: true,
      programId,
    }
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

// Helper function to get client's userId from trainer's client document
export async function getClientUserId(trainerId: string, clientId: string): Promise<string | null> {
  try {
    const clientRef = doc(db, "users", trainerId, "clients", clientId)
    const [clientDoc, error] = await tryCatch(
      () => import("firebase/firestore").then(({ getDoc }) => getDoc(clientRef)),
      ErrorType.DB_READ_FAILED,
      {
        function: "getClientUserId",
        trainerId,
        clientId,
      },
    )

    if (error || !clientDoc || !clientDoc.exists()) {
      return null
    }

    const clientData = clientDoc.data()
    return clientData?.userId || null
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "getClientUserId", trainerId, clientId },
      "Failed to get client user ID",
    )
    logError(appError)
    return null
  }
}
