import { doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { ErrorType, createError, logError, tryCatch } from "@/lib/utils/error-handler"

export type SubscriptionPlan = "trainer_basic" | "trainer_pro" | "trainer_elite"

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

// Update user subscription plan
export async function updateSubscriptionPlan(
  userId: string,
  plan: SubscriptionPlan,
): Promise<{ success: boolean; error?: any }> {
  try {
    if (!userId || !plan) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "updateSubscriptionPlan" },
        "User ID and plan are required",
      )
      logError(error)
      return { success: false, error }
    }

    console.log(`[updateSubscriptionPlan] Updating plan for user ${userId} to: ${plan}`)

    const userRef = doc(db, "users", userId)
    const [, updateError] = await tryCatch(
      () =>
        updateDoc(userRef, {
          subscriptionPlan: plan,
          subscriptionUpdatedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      ErrorType.DB_WRITE_FAILED,
      { function: "updateSubscriptionPlan", userId, plan },
    )

    if (updateError) {
      console.error(`[updateSubscriptionPlan] ❌ Failed to update plan:`, updateError)
      return { success: false, error: updateError }
    }

    console.log(`[updateSubscriptionPlan] ✅ Successfully updated plan for user ${userId} to: ${plan}`)
    return { success: true }
  } catch (error) {
    console.error("[updateSubscriptionPlan] ❌ Unexpected error:", error)
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "updateSubscriptionPlan", userId, plan },
      "Unexpected error updating subscription plan",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}

// Get user subscription plan
export async function getUserSubscriptionPlan(userId: string): Promise<SubscriptionPlan | null> {
  try {
    if (!userId) {
      console.error("User ID is required")
      return null
    }

    const { getUserById } = await import("./user-service")
    const userData = await getUserById(userId)

    if (!userData) {
      console.error("User not found")
      return null
    }

    return userData.subscriptionPlan || "trainer_basic"
  } catch (error) {
    console.error("Error getting user subscription plan:", error)
    return null
  }
}
