import { db } from "./firebase"
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"
import { createError, ErrorType, logError, type AppError } from "@/lib/utils/error-handler" // Corrected import
import type { WorkoutProgram } from "@/types/workout-program"

export async function getSharedWorkout(
  userId: string,
  workoutId: string,
): Promise<[WorkoutProgram | null, AppError | null]> {
  try {
    const workoutRef = doc(db, "users", userId, "workouts", workoutId)
    const workoutSnap = await getDoc(workoutRef)

    if (!workoutSnap.exists()) {
      const error = createError(
        ErrorType.DB_DOCUMENT_NOT_FOUND,
        null,
        { userId, workoutId },
        "Shared workout not found.",
      )
      logError(error)
      return [null, error]
    }

    return [workoutSnap.data() as WorkoutProgram, null]
  } catch (error: any) {
    const appError = createError(
      ErrorType.DB_READ_FAILED,
      error,
      { userId, workoutId, service: "Firebase" },
      "Failed to fetch shared workout.",
    )
    logError(appError)
    return [null, appError]
  }
}

export async function addCommentToSharedWorkout(
  userId: string,
  workoutId: string,
  comment: { text: string; authorId: string; authorName: string; timestamp: any },
): Promise<[boolean, AppError | null]> {
  try {
    const workoutRef = doc(db, "users", userId, "workouts", workoutId)
    await updateDoc(workoutRef, {
      comments: arrayUnion(comment),
    })
    return [true, null]
  } catch (error: any) {
    const appError = createError(
      ErrorType.DB_WRITE_FAILED,
      error,
      { userId, workoutId, service: "Firebase", operation: "addComment" },
      "Failed to add comment to shared workout.",
    )
    logError(appError)
    return [false, appError]
  }
}

export async function removeCommentFromSharedWorkout(
  userId: string,
  workoutId: string,
  comment: { text: string; authorId: string; authorName: string; timestamp: any },
): Promise<[boolean, AppError | null]> {
  try {
    const workoutRef = doc(db, "users", userId, "workouts", workoutId)
    await updateDoc(workoutRef, {
      comments: arrayRemove(comment),
    })
    return [true, null]
  } catch (error: any) {
    const appError = createError(
      ErrorType.DB_WRITE_FAILED,
      error,
      { userId, workoutId, service: "Firebase", operation: "removeComment" },
      "Failed to remove comment from shared workout.",
    )
    logError(appError)
    return [false, appError]
  }
}
