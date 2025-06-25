import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import type { AppError } from "@/lib/utils/error-handler"
import { createError, ErrorType, logError, tryCatch } from "@/lib/utils/error-handler"

// Function to get user data by UID
export async function getUserData(uid: string): Promise<any | null> {
  try {
    console.log(`[getUserData] Fetching user data for UID: ${uid}`)

    if (!uid) {
      const error = createError(ErrorType.API_MISSING_PARAMS, null, { function: "getUserData" }, "User UID is required")
      logError(error)
      return null
    }

    const userRef = doc(db, "users", uid)
    const [userDoc, error] = await tryCatch(() => getDoc(userRef), ErrorType.DB_READ_FAILED, {
      function: "getUserData",
      uid,
    })

    if (error || !userDoc) {
      console.error(`[getUserData] Error fetching user document for ${uid}:`, error)
      return null
    }

    if (!userDoc.exists()) {
      console.warn(`[getUserData] User document not found for UID: ${uid}`)
      return null
    }

    const data = userDoc.data()
    console.log(`[getUserData] Successfully fetched user data for ${uid}:`, data)
    return { id: userDoc.id, ...data }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "getUserData", uid },
      "Unexpected error fetching user data",
    )
    logError(appError)
    console.error(`[getUserData] Unexpected error:`, error)
    return null
  }
}

// Function to update user profile
export async function updateUserProfile(
  uid: string,
  updates: {
    name?: string
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    photoURL?: string
    role?: string
    status?: string
    universalInviteCode?: string
    invitedBy?: string
    pendingUsers?: string[]
    clients?: string[]
    // Add other fields as needed
  },
): Promise<{ success: boolean; error?: AppError }> {
  try {
    console.log(`[updateUserProfile] Updating profile for UID: ${uid} with updates:`, updates)

    if (!uid) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "updateUserProfile" },
        "User UID is required",
      )
      logError(error)
      return { success: false, error }
    }

    const userRef = doc(db, "users", uid)
    const [, updateError] = await tryCatch(
      () =>
        updateDoc(userRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        }),
      ErrorType.DB_WRITE_FAILED,
      { function: "updateUserProfile", uid, updates },
    )

    if (updateError) {
      console.error(`[updateUserProfile] Error updating user document for ${uid}:`, updateError)
      return { success: false, error: updateError }
    }

    console.log(`[updateUserProfile] Successfully updated profile for UID: ${uid}`)
    return { success: true }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "updateUserProfile", uid, updates },
      "Unexpected error updating user profile",
    )
    logError(appError)
    console.error(`[updateUserProfile] Unexpected error:`, error)
    return { success: false, error: appError }
  }
}
