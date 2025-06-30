import { collection, doc, addDoc, updateDoc, getDocs, getDoc, query, where, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { v4 as uuidv4 } from "uuid"
import type { WorkoutProgram, WorkoutRoutine, ProgramExercise } from "@/types/workout-program"
import { ErrorType, createError, logError, tryCatch } from "@/lib/utils/error-handler"

// Types for mobile app format
interface MobileRoutine {
  id: string
  name: string
  notes: string
  createdAt: any
  updatedAt: any
  deletedAt: null
  type: "program"
  exercises: MobileExercise[]
}

interface MobileExercise {
  id: string
  name: string
  video_url?: string
  notes: string
  sets: MobileSet[]
}

interface MobileSet {
  id: string
  reps: string
  type: string
  weight: string
  notes: string
}

interface MobileProgram {
  id: string
  name: string
  notes: string
  program_URL?: string
  createdAt: any
  updatedAt: any
  startedAt: any
  duration: number
  routines: RoutineReference[]
}

interface RoutineReference {
  routineId: string
  week: number
  order: number
}

// Check if exercise exists globally or in user's custom exercises
async function ensureExerciseExists(userId: string, exerciseName: string): Promise<string> {
  try {
    // First check global exercises collection
    const globalExercisesRef = collection(db, "exercises")
    const globalQuery = query(globalExercisesRef, where("name", "==", exerciseName))
    const [globalSnapshot, globalError] = await tryCatch(() => getDocs(globalQuery), ErrorType.DB_READ_FAILED, {
      function: "ensureExerciseExists",
      userId,
      exerciseName,
    })

    if (!globalError && globalSnapshot && !globalSnapshot.empty) {
      return globalSnapshot.docs[0].id
    }

    // Check user's custom exercises
    const userExercisesRef = collection(db, "users", userId, "exercises")
    const userQuery = query(userExercisesRef, where("name", "==", exerciseName))
    const [userSnapshot, userError] = await tryCatch(() => getDocs(userQuery), ErrorType.DB_READ_FAILED, {
      function: "ensureExerciseExists",
      userId,
      exerciseName,
    })

    if (!userError && userSnapshot && !userSnapshot.empty) {
      return userSnapshot.docs[0].id
    }

    // Exercise doesn't exist, create it in user's custom exercises
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
      () =>
        doc(userExercisesRef, exerciseId).set
          ? updateDoc(doc(userExercisesRef, exerciseId), exerciseDoc)
          : addDoc(userExercisesRef, exerciseDoc),
      ErrorType.DB_WRITE_FAILED,
      { function: "ensureExerciseExists", userId, exerciseName, exerciseId },
    )

    if (createError) {
      console.error("Failed to create custom exercise:", createError)
      return uuidv4() // Return a fallback ID
    }

    console.log(`✅ Created custom exercise: ${exerciseName}`)
    return exerciseId
  } catch (error) {
    console.error("Error ensuring exercise exists:", error)
    return uuidv4() // Return a fallback ID
  }
}

// Convert PT program exercise to mobile format
async function convertExerciseToMobile(
  userId: string,
  exercise: ProgramExercise,
  weekNumber: number,
): Promise<MobileExercise> {
  const exerciseId = await ensureExerciseExists(userId, exercise.name)

  // Get the sets for the specific week
  const weekData = exercise.weeks?.find((w) => w.week_number === weekNumber)
  const sets = weekData?.sets || exercise.sets || []

  const mobileSets: MobileSet[] = sets.map((set) => {
    const rpe = set.rpe ? `RPE: ${set.rpe}` : ""
    const rest = set.rest ? `Rest: ${set.rest}` : ""
    const notes = [rpe, rest].filter(Boolean).join(" | ")

    return {
      id: uuidv4(),
      reps: set.reps?.toString() || "",
      type: set.warmup ? "warmup" : "normal",
      weight: set.weight?.toString() || "",
      notes: notes || set.notes || "",
    }
  })

  return {
    id: exerciseId,
    name: exercise.name,
    video_url: exercise.exercise_video || undefined,
    notes: exercise.notes || "",
    sets: mobileSets,
  }
}

// Convert PT routine to mobile format
async function convertRoutineToMobile(
  userId: string,
  routine: WorkoutRoutine,
  weekNumber: number,
): Promise<MobileRoutine> {
  const routineId = uuidv4()
  const timestamp = serverTimestamp()

  const mobileExercises: MobileExercise[] = []

  for (const exercise of routine.exercises) {
    const mobileExercise = await convertExerciseToMobile(userId, exercise, weekNumber)
    mobileExercises.push(mobileExercise)
  }

  return {
    id: routineId,
    name: routine.routine_name,
    notes: "",
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
    type: "program",
    exercises: mobileExercises,
  }
}

// Main function to convert and send program to client
export async function convertAndSendProgramToClient(
  trainerId: string,
  clientId: string,
  program: WorkoutProgram,
  message?: string,
): Promise<{ success: boolean; error?: any }> {
  try {
    console.log(`[convertAndSendProgramToClient] Starting conversion for client: ${clientId}`)

    if (!trainerId || !clientId || !program) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "convertAndSendProgramToClient" },
        "Trainer ID, client ID, and program are required",
      )
      logError(error)
      return { success: false, error }
    }

    // Get client data to find userId
    const clientRef = doc(db, "users", trainerId, "clients", clientId)
    const [clientDoc, clientError] = await tryCatch(() => getDoc(clientRef), ErrorType.DB_READ_FAILED, {
      function: "convertAndSendProgramToClient",
      trainerId,
      clientId,
    })

    if (clientError || !clientDoc || !clientDoc.exists()) {
      const error = createError(
        ErrorType.DB_DOCUMENT_NOT_FOUND,
        null,
        { function: "convertAndSendProgramToClient", trainerId, clientId },
        "Client not found",
      )
      logError(error)
      return { success: false, error }
    }

    const clientData = clientDoc.data()
    const userId = clientData.userId

    if (!userId) {
      const error = createError(
        ErrorType.DB_FIELD_MISSING,
        null,
        { function: "convertAndSendProgramToClient", trainerId, clientId },
        "Client does not have a userId",
      )
      logError(error)
      return { success: false, error }
    }

    console.log(`[convertAndSendProgramToClient] Found userId: ${userId}`)

    // Step 1: Create all routines for the program
    const routineReferences: RoutineReference[] = []
    const routinesRef = collection(db, "users", userId, "routines")

    if (program.is_periodized && program.weeks) {
      // Handle periodized program - create routines for each week
      for (const week of program.weeks) {
        const weekNumber = week.week_number

        if (week.routines) {
          for (let routineIndex = 0; routineIndex < week.routines.length; routineIndex++) {
            const routine = week.routines[routineIndex]
            const mobileRoutine = await convertRoutineToMobile(userId, routine, weekNumber)

            // Save routine to Firestore
            const [, routineError] = await tryCatch(
              () =>
                doc(routinesRef, mobileRoutine.id).set
                  ? updateDoc(doc(routinesRef, mobileRoutine.id), mobileRoutine)
                  : addDoc(routinesRef, mobileRoutine),
              ErrorType.DB_WRITE_FAILED,
              { function: "convertAndSendProgramToClient", userId, routineId: mobileRoutine.id },
            )

            if (routineError) {
              console.error(`Failed to create routine: ${routine.routine_name}`, routineError)
              continue
            }

            routineReferences.push({
              routineId: mobileRoutine.id,
              week: weekNumber,
              order: routineIndex + 1,
            })

            console.log(`✅ Created routine: ${routine.routine_name} (Week ${weekNumber})`)
          }
        }
      }
    } else {
      // Handle non-periodized program - create routines for each week of the program duration
      const singleWeekRoutines = program.weeks?.[0]?.routines || program.routines || []

      for (let week = 1; week <= program.program_weeks; week++) {
        for (let routineIndex = 0; routineIndex < singleWeekRoutines.length; routineIndex++) {
          const routine = singleWeekRoutines[routineIndex]
          const mobileRoutine = await convertRoutineToMobile(userId, routine, 1) // Use week 1 data for all weeks

          // Save routine to Firestore
          const [, routineError] = await tryCatch(
            () =>
              doc(routinesRef, mobileRoutine.id).set
                ? updateDoc(doc(routinesRef, mobileRoutine.id), mobileRoutine)
                : addDoc(routinesRef, mobileRoutine),
            ErrorType.DB_WRITE_FAILED,
            { function: "convertAndSendProgramToClient", userId, routineId: mobileRoutine.id },
          )

          if (routineError) {
            console.error(`Failed to create routine: ${routine.routine_name}`, routineError)
            continue
          }

          routineReferences.push({
            routineId: mobileRoutine.id,
            week: week,
            order: routineIndex + 1,
          })

          console.log(`✅ Created routine: ${routine.routine_name} (Week ${week})`)
        }
      }
    }

    // Step 2: Create the program document
    const programId = uuidv4()
    const timestamp = serverTimestamp()

    const mobileProgram: MobileProgram = {
      id: programId,
      name: program.program_title,
      notes: program.program_notes || "",
      program_URL: program.program_URL || "",
      createdAt: timestamp,
      updatedAt: timestamp,
      startedAt: timestamp,
      duration: program.program_weeks,
      routines: routineReferences,
    }

    const programsRef = collection(db, "users", userId, "programs")
    const [, programError] = await tryCatch(
      () =>
        doc(programsRef, programId).set
          ? updateDoc(doc(programsRef, programId), mobileProgram)
          : addDoc(programsRef, mobileProgram),
      ErrorType.DB_WRITE_FAILED,
      { function: "convertAndSendProgramToClient", userId, programId },
    )

    if (programError) {
      return { success: false, error: programError }
    }

    console.log(`✅ Created program: ${program.program_title}`)

    // Step 3: Update client status to indicate program was sent
    const [, updateClientError] = await tryCatch(
      () =>
        updateDoc(clientRef, {
          lastProgramSent: {
            programId: programId,
            programName: program.program_title,
            sentAt: timestamp,
            message: message || "",
          },
          updatedAt: timestamp,
        }),
      ErrorType.DB_WRITE_FAILED,
      { function: "convertAndSendProgramToClient", trainerId, clientId },
    )

    if (updateClientError) {
      console.error("Failed to update client with program info:", updateClientError)
      // Don't fail the entire operation for this
    }

    console.log(`🎉 Successfully sent program to client: ${clientData.name}`)
    return { success: true }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "convertAndSendProgramToClient", trainerId, clientId },
      "Unexpected error converting and sending program",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}

// Helper function to get client's userId
export async function getClientUserId(trainerId: string, clientId: string): Promise<string | null> {
  try {
    const clientRef = doc(db, "users", trainerId, "clients", clientId)
    const [clientDoc, error] = await tryCatch(() => getDoc(clientRef), ErrorType.DB_READ_FAILED, {
      function: "getClientUserId",
      trainerId,
      clientId,
    })

    if (error || !clientDoc || !clientDoc.exists()) {
      return null
    }

    return clientDoc.data()?.userId || null
  } catch (error) {
    console.error("Error getting client userId:", error)
    return null
  }
}
