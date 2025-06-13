import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { ErrorType, createError, logError, tryCatch } from "@/lib/utils/error-handler"

export interface FeedbackData {
  feedback: string
  sentiment?: "sad" | "neutral" | "happy"
  app: string
  page?: string
  userAgent?: string
}

export async function submitFeedback(
  userId: string,
  feedbackData: FeedbackData,
): Promise<{ success: boolean; error?: any }> {
  try {
    if (!userId || !feedbackData.feedback) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "submitFeedback" },
        "User ID and feedback text are required",
      )
      logError(error)
      return { success: false, error }
    }

    // Reference to user's feedback subcollection
    const feedbackRef = collection(db, "users", userId, "feedbacks")

    const feedbackDoc = {
      ...feedbackData,
      createdAt: serverTimestamp(),
      userId: userId,
    }

    const [docRef, error] = await tryCatch(() => addDoc(feedbackRef, feedbackDoc), ErrorType.DB_WRITE_FAILED, {
      function: "submitFeedback",
      userId,
      feedbackData,
    })

    if (error || !docRef) {
      return { success: false, error }
    }

    console.log(`[submitFeedback] ✅ Feedback submitted successfully: ${docRef.id}`)
    return { success: true }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "submitFeedback", userId, feedbackData },
      "Unexpected error submitting feedback",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}
