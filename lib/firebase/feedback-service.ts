import { db } from "./firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { createError, ErrorType, logError, type AppError } from "@/lib/utils/error-handler" // Corrected import

export async function submitFeedback(
  userId: string,
  feedbackText: string,
  rating: number,
  context: string,
): Promise<[boolean, AppError | null]> {
  try {
    await addDoc(collection(db, "feedback"), {
      userId,
      feedbackText,
      rating,
      context,
      timestamp: serverTimestamp(),
    })
    return [true, null]
  } catch (error: any) {
    const appError = createError(
      ErrorType.EXTERNAL_SERVICE_ERROR,
      error,
      { service: "Firebase", operation: "submitFeedback" },
      "Failed to submit feedback.",
    )
    logError(appError)
    return [false, appError]
  }
}
