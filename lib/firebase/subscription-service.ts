import { db } from "./firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { createError, ErrorType, logError, type AppError } from "@/lib/utils/error-handler" // Corrected import

interface Subscription {
  status: "active" | "inactive" | "trialing" | "canceled"
  startDate: Date
  endDate?: Date
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  planId: string
}

export async function getSubscriptionStatus(userId: string): Promise<[Subscription | null, AppError | null]> {
  try {
    const docRef = doc(db, "subscriptions", userId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return [docSnap.data() as Subscription, null]
    } else {
      return [null, null] // No subscription found
    }
  } catch (error: any) {
    const appError = createError(
      ErrorType.DB_READ_FAILED,
      error,
      { service: "Firebase", operation: "getSubscriptionStatus", userId },
      "Failed to fetch subscription status.",
    )
    logError(appError)
    return [null, appError]
  }
}

export async function updateSubscriptionStatus(
  userId: string,
  subscriptionData: Partial<Subscription>,
): Promise<[boolean, AppError | null]> {
  try {
    const docRef = doc(db, "subscriptions", userId)
    await setDoc(docRef, subscriptionData, { merge: true })
    return [true, null]
  } catch (error: any) {
    const appError = createError(
      ErrorType.DB_WRITE_FAILED,
      error,
      { service: "Firebase", operation: "updateSubscriptionStatus", userId, subscriptionData },
      "Failed to update subscription status.",
    )
    logError(appError)
    return [false, appError]
  }
}
