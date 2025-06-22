// lib/firebase/program-assignment-service.ts
import { collection, doc, setDoc, getDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore"
import { v4 as uuidv4 } from "uuid"
import type { WorkoutProgram } from "@/types/workout-program"
import { ErrorType, createError, logError } from "@/lib/utils/error-handler"
import { db } from "@/lib/firebase/firebase" // Client-side Firestore instance

// Define the target client-side structures for Firebase documents
interface ClientProgramDoc {
  id: string
  name: string // From program_title
  notes?: string | null // From program_notes
  startedAt: any // Firestore Timestamp
  duration: number // From program_weeks
  createdAt: any // Firestore Timestamp
  updatedAt: any // Firestore Timestamp
  routines: {
    routineId: string
    week: number
    order: number
  }[]
}

interface ClientRoutineDoc {
  id: string
  name: string
  notes?: string | null
  createdAt: any // Firestore Timestamp
  updatedAt: any // Firestore Timestamp
  deletedAt: null
  type: "program" // Flag for program routines
  exercises: {
    id: string // Exercise ID (from global or custom collection)
    name: string
    video_url?: string | null
    notes?: string | null // Exercise-specific notes
    sets: {
      id: string // UUID for the set
      type: string // e.g., "normal", "warmup"
      weight?: string | number | null
      reps?: string | number | null
      duration_sec?: string | number | null
      notes?: string | null // Combined RPE, Rest, etc.
    }[]
  }[]
}

interface ClientExerciseDoc {
  id: string
  name: string
  muscleGroup?: string
  isCardio?: boolean
  isFullBody?: boolean
  isMobility?: boolean
  createdAt: any
  updatedAt: any
  deletedAt: null
}

/**
 * Checks if an exercise exists globally or in the user's custom collection.
 * If not found, creates it in the user's custom exercises collection.
 * Returns the ID of the existing or newly created exercise.
 */
async function ensureExerciseExistsAndGetId(
  clientUserId: string, // This is the client's actual Firebase User ID
  exerciseName: string,
  exerciseCategory: string,
  exerciseVideo?: string | null,
  notes?: string | null,
): Promise<string> {
  try {
    // 1. Check in client's custom exercises collection
    const userExercisesRef = collection(db, `users/${clientUserId}/exercises`)
    const qUser = query(userExercisesRef, where("name", "==", exerciseName))
    const userSnapshot = await getDocs(qUser)

    if (!userSnapshot.empty) {
      return userSnapshot.docs[0].id
    }

    // 2. Check in global exercises collection (assuming a top-level 'exercises' collection)
    const globalExercisesRef = collection(db, "exercises")
    const qGlobal = query(globalExercisesRef, where("name", "==", exerciseName))
    const globalSnapshot = await getDocs(qGlobal)

    if (!globalSnapshot.empty) {
      return globalSnapshot.docs[0].id
    }

    // 3. If not found, create a new exercise in the client's custom exercises collection
    const newExerciseId = uuidv4()
    const newExerciseDoc: ClientExerciseDoc = {
      id: newExerciseId,
      name: exerciseName,
      muscleGroup: exerciseCategory, // Map category to muscleGroup
      isCardio: exerciseCategory === "Cardio",
      isFullBody: false, // Default, can be refined based on actual exercise data
      isMobility: false, // Default, can be refined based on actual exercise data
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deletedAt: null,
    }

    await setDoc(doc(userExercisesRef, newExerciseId), newExerciseDoc)
    console.log(`Created new exercise for client ${clientUserId}: ${exerciseName}`)
    return newExerciseId
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "ensureExerciseExistsAndGetId", clientUserId, exerciseName },
      "Failed to ensure exercise existence or create new one",
    )
    logError(appError)
    throw appError // Re-throw to propagate error
  }
}

/**
 * Assigns a workout program (from trainer's import) to a specific client.
 * This involves creating routines and the main program document in the client's Firebase structure.
 */
export async function assignProgramToClient(
  trainerId: string,
  clientId: string, // This is the client's document ID under the trainer's 'clients' subcollection
  programData: WorkoutProgram, // This is the program object from the import sheet
): Promise<{ success: boolean; programId?: string; error?: any }> {
  try {
    if (!trainerId || !clientId || !programData) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "assignProgramToClient" },
        "Trainer ID, client ID, and program data are required",
      )
      logError(error)
      return { success: false, error }
    }

    // Get the actual Firebase User ID (uid) of the client from their client document
    const clientDocRef = doc(db, "users", trainerId, "clients", clientId)
    const clientDocSnap = await getDoc(clientDocRef)

    if (!clientDocSnap.exists()) {
      const error = createError(
        ErrorType.DB_DOCUMENT_NOT_FOUND,
        null,
        { function: "assignProgramToClient", trainerId, clientId },
        "Client document not found for assignment. Ensure the client exists under the trainer.",
      )
      logError(error)
      return { success: false, error }
    }
    const clientUserId = clientDocSnap.data()?.userId

    if (!clientUserId) {
      const error = createError(
        ErrorType.DB_FIELD_MISSING,
        null,
        { function: "assignProgramToClient", trainerId, clientId },
        "Client document does not contain a valid 'userId' field.",
      )
      logError(error)
      return { success: false, error }
    }

    console.log(`[Program Assignment Service] Assigning program to client with userId: ${clientUserId}`)

    const clientRoutinesRef = collection(db, `users/${clientUserId}/routines`)
    const clientProgramsRef = collection(db, `users/${clientUserId}/programs`)
    const timestamp = serverTimestamp()

    const programRoutinesMap: ClientProgramDoc["routines"] = []

    const isPeriodized = programData.is_periodized

    if (isPeriodized) {
      // For periodized programs, we create a separate routine document for each week's specific exercises
      for (let weekNum = 1; weekNum <= programData.program_weeks; weekNum++) {
        for (const trainerRoutine of programData.routines) {
          const clientRoutineId = uuidv4()
          const clientRoutineExercises: ClientRoutineDoc["exercises"] = []

          for (const programExercise of trainerRoutine.exercises) {
            const weekSpecificData = programExercise.weeks.find((w) => w.week_number === weekNum)

            if (weekSpecificData) {
              const exerciseId = await ensureExerciseExistsAndGetId(
                clientUserId,
                programExercise.name,
                programExercise.exercise_category,
                programExercise.exercise_video,
                programExercise.notes,
              )

              const sets: ClientRoutineDoc["exercises"][0]["sets"] = weekSpecificData.sets.map((s) => ({
                id: uuidv4(),
                type: s.warmup ? "warmup" : "normal",
                weight: s.weight ?? null, // Use null for empty string if preferred
                reps: s.reps ?? null,
                duration_sec: s.duration_sec ?? null,
                notes: [s.rpe ? `RPE: ${s.rpe}` : "", s.rest ? `Rest: ${s.rest}` : "", s.notes]
                  .filter(Boolean)
                  .join(" | "),
              }))

              clientRoutineExercises.push({
                id: exerciseId,
                name: programExercise.name,
                video_url: programExercise.exercise_video,
                notes: programExercise.notes,
                sets: sets,
              })
            }
          }

          if (clientRoutineExercises.length > 0) {
            const clientRoutineDoc: ClientRoutineDoc = {
              id: clientRoutineId,
              name: `${trainerRoutine.routine_name} - Week ${weekNum}`, // Name routine by week for clarity
              notes: trainerRoutine.notes || null,
              createdAt: timestamp,
              updatedAt: timestamp,
              deletedAt: null,
              type: "program",
              exercises: clientRoutineExercises,
            }

            await setDoc(doc(clientRoutinesRef, clientRoutineId), clientRoutineDoc)
            console.log(`✅ Uploaded routine for client ${clientUserId}: ${clientRoutineDoc.name}`)

            programRoutinesMap.push({
              routineId: clientRoutineId,
              week: weekNum,
              order: Number.parseInt(trainerRoutine.routine_rank || "1", 10), // Use routine_rank as order
            })
          }
        }
      }
    } else {
      // For non-periodized programs, each 'WorkoutRoutine' is a single client routine document,
      // and it applies to all weeks of the program.
      for (const trainerRoutine of programData.routines) {
        const clientRoutineId = uuidv4()
        const clientRoutineExercises: ClientRoutineDoc["exercises"] = []

        for (const programExercise of trainerRoutine.exercises) {
          // For non-periodized, use the first week's data as it's assumed constant across weeks
          const firstWeekData = programExercise.weeks[0]

          if (firstWeekData) {
            const exerciseId = await ensureExerciseExistsAndGetId(
              clientUserId,
              programExercise.name,
              programExercise.exercise_category,
              programExercise.exercise_video,
              programExercise.notes,
            )

            const sets: ClientRoutineDoc["exercises"][0]["sets"] = firstWeekData.sets.map((s) => ({
              id: uuidv4(),
              type: s.warmup ? "warmup" : "normal",
              weight: s.weight ?? null,
              reps: s.reps ?? null,
              duration_sec: s.duration_sec ?? null,
              notes: [s.rpe ? `RPE: ${s.rpe}` : "", s.rest ? `Rest: ${s.rest}` : "", s.notes]
                .filter(Boolean)
                .join(" | "),
            }))

            clientRoutineExercises.push({
              id: exerciseId,
              name: programExercise.name,
              video_url: programExercise.exercise_video,
              notes: programExercise.notes,
              sets: sets,
            })
          }
        }

        if (clientRoutineExercises.length > 0) {
          const clientRoutineDoc: ClientRoutineDoc = {
            id: clientRoutineId,
            name: trainerRoutine.routine_name,
            notes: trainerRoutine.notes || null,
            createdAt: timestamp,
            updatedAt: timestamp,
            deletedAt: null,
            type: "program",
            exercises: clientRoutineExercises,
          }

          await setDoc(doc(clientRoutinesRef, clientRoutineId), clientRoutineDoc)
          console.log(`✅ Uploaded routine for client ${clientUserId}: ${clientRoutineDoc.name}`)

          // For non-periodized, this routine applies to all weeks of the program
          for (let week = 1; week <= programData.program_weeks; week++) {
            programRoutinesMap.push({
              routineId: clientRoutineId,
              week: week,
              order: Number.parseInt(trainerRoutine.routine_rank || "1", 10),
            })
          }
        }
      }
    }

    // Create the main program document for the client
    const clientProgramId = uuidv4()
    const clientProgramDoc: ClientProgramDoc = {
      id: clientProgramId,
      name: programData.program_title,
      notes: programData.program_notes || null,
      startedAt: timestamp, // Program starts now for the client
      duration: programData.program_weeks,
      createdAt: timestamp,
      updatedAt: timestamp,
      routines: programRoutinesMap,
    }

    await setDoc(doc(clientProgramsRef, clientProgramId), clientProgramDoc)
    console.log(`✅ Uploaded program for client ${clientUserId}: ${clientProgramDoc.name}`)

    return { success: true, programId: clientProgramId }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "assignProgramToClient", trainerId, clientId, programData },
      "Unexpected error assigning program to client",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}
