import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import type { AppError } from "@/lib/utils/error-handler" // Corrected import
import { createError, ErrorType, logError, tryCatch } from "@/lib/utils/error-handler"

// Define a type for the subscription plan
export type SubscriptionPlan = {
  id: string
  name: string
  price: number
  currency: string
  interval: "month" | "year" | "week" | "day"
  status: "active" | "inactive" | "canceled" | "trialing"
  startDate: Date
  endDate?: Date
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  // Add other fields as needed
}

// Function to get user's subscription plan
export async function getUserSubscriptionPlan(
  userId: string,
): Promise<{ plan: SubscriptionPlan | null; error?: AppError }> {
  try {
    console.log(`[getUserSubscriptionPlan] Fetching subscription plan for user: ${userId}`)

    if (!userId) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "getUserSubscriptionPlan" },
        "User ID is required",
      )
      logError(error)
      return { plan: null, error }
    }

    const userRef = doc(db, "users", userId)
    const [userDoc, error] = await tryCatch(() => getDoc(userRef), ErrorType.DB_READ_FAILED, {
      function: "getUserSubscriptionPlan",
      userId,
    })

    if (error || !userDoc) {
      console.error(`[getUserSubscriptionPlan] Error fetching user document for ${userId}:`, error)
      return { plan: null, error }
    }

    if (!userDoc.exists()) {
      console.warn(`[getUserSubscriptionPlan] User document not found for UID: ${userId}`)
      return {
        plan: null,
        error: createError(
          ErrorType.DB_DOCUMENT_NOT_FOUND,
          null,
          { function: "getUserSubscriptionPlan", userId },
          "User not found",
        ),
      }
    }

    const userData = userDoc.data()
    const subscriptionData = userData?.subscription as SubscriptionPlan | undefined

    if (subscriptionData) {
      console.log(`[getUserSubscriptionPlan] Found subscription data for ${userId}:`, subscriptionData)
      // Convert Firestore Timestamps to Date objects if necessary
      const plan: SubscriptionPlan = {
        ...subscriptionData,
        startDate: subscriptionData.startDate?.toDate ? subscriptionData.startDate.toDate() : new Date(), // Handle Timestamp conversion
        endDate: subscriptionData.endDate?.toDate ? subscriptionData.endDate.toDate() : undefined,
      }
      return { plan }
    } else {
      console.log(`[getUserSubscriptionPlan] No active subscription found for user: ${userId}`)
      return { plan: null }
    }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "getUserSubscriptionPlan", userId },
      "Unexpected error fetching user subscription plan",
    )
    logError(appError)
    console.error(`[getUserSubscriptionPlan] Unexpected error:`, error)
    return { plan: null, error: appError }
  }
}

// Set default subscription plan for new users
export async function setDefaultSubscriptionPlan(userId: string): Promise<{ success: boolean; error?: any }> {
  try {
    if (!userId) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "setDefaultSubscriptionPlan" },
        "User ID is required",
      )
      logError(error)
      return { success: false, error }
    }

    console.log(`[setDefaultSubscriptionPlan] Setting default plan for user: ${userId}`)

    const userRef = doc(db, "users", userId)
    const [, updateError] = await tryCatch(
      () =>
        updateDoc(userRef, {
          subscriptionPlan: "trainer_basic",
          subscriptionUpdatedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      ErrorType.DB_WRITE_FAILED,
      { function: "setDefaultSubscriptionPlan", userId },
    )

    if (updateError) {
      console.error(`[setDefaultSubscriptionPlan] ❌ Failed to set default plan:`, updateError)
      return { success: false, error: updateError }
    }

    console.log(`[setDefaultSubscriptionPlan] ✅ Successfully set trainer_basic plan for user: ${userId}`)
    return { success: true }
  } catch (error) {
    console.error("[setDefaultSubscriptionPlan] ❌ Unexpected error:", error)
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "setDefaultSubscriptionPlan", userId },
      "Unexpected error setting default subscription plan",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}

// Function to update user's subscription plan
export async function updateSubscriptionPlan(
  userId: string,
  planData: Partial<SubscriptionPlan>,
): Promise<{ success: boolean; error?: AppError }> {
  try {
    console.log(`[updateSubscriptionPlan] Updating subscription plan for user: ${userId} with data:`, planData)

    if (!userId) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "updateSubscriptionPlan" },
        "User ID is required",
      )
      logError(error)
      return { success: false, error }
    }

    const userRef = doc(db, "users", userId)
    const [, updateError] = await tryCatch(
      () =>
        updateDoc(userRef, {
          subscription: {
            ...planData,
            updatedAt: serverTimestamp(), // Add or update timestamp
          },
        }),
      ErrorType.DB_WRITE_FAILED,
      { function: "updateSubscriptionPlan", userId, planData },
    )

    if (updateError) {
      console.error(`[updateSubscriptionPlan] Error updating subscription document for ${userId}:`, updateError)
      return { success: false, error: updateError }
    }

    console.log(`[updateSubscriptionPlan] Successfully updated subscription plan for user: ${userId}`)
    return { success: true }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "updateSubscriptionPlan", userId, planData },
      "Unexpected error updating user subscription plan",
    )
    logError(appError)
    console.error(`[updateSubscriptionPlan] Unexpected error:`, error)
    return { success: false, error: appError }
  }
}
