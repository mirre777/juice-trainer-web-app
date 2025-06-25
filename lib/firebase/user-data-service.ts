import { db } from "@/lib/firebase/firebase"
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import type { AppError } from "@/lib/utils/error-handler"
import { createError, ErrorType, logError, tryCatch } from "@/lib/utils/error-handler"

export type UserData = {
  userId: string
  email: string
  displayName: string | null
  photoURL: string | null
  createdAt: Date
  updatedAt: Date
  lastSignInTime: Date
  emailVerified: boolean
  disabled: boolean
  phoneNumber: string | null
}

export class UserDataService {
  static async getUserData(userId: string): Promise<any | null> {
    try {
      console.log(`[getUserData] Fetching user data for UID: ${userId}`)

      if (!userId) {
        const error = createError(
          ErrorType.API_MISSING_PARAMS,
          null,
          { function: "getUserData" },
          "User UID is required",
        )
        logError(error)
        return null
      }

      const userRef = doc(db, "users", userId)
      const [userDoc, error] = await tryCatch(() => getDoc(userRef), ErrorType.DB_READ_FAILED, {
        function: "getUserData",
        userId,
      })

      if (error || !userDoc) {
        console.error(`[getUserData] Error fetching user document for ${userId}:`, error)
        return null
      }

      if (!userDoc.exists()) {
        console.warn(`[getUserData] User document not found for UID: ${userId}`)
        return null
      }

      const data = userDoc.data()
      console.log(`[getUserData] Successfully fetched user data for ${userId}:`, data)
      return { id: userDoc.id, ...data }
    } catch (error) {
      const appError = createError(
        ErrorType.UNKNOWN_ERROR,
        error,
        { function: "getUserData", userId },
        "Unexpected error fetching user data",
      )
      logError(appError)
      console.error(`[getUserData] Unexpected error:`, error)
      return null
    }
  }

  static async createUserData(userData: UserData): Promise<void> {
    try {
      const userDocRef = doc(db, "users", userData.userId)
      await setDoc(userDocRef, userData)
    } catch (error: any) {
      console.error("Error creating user data:", error)
      throw {
        message: "Failed to create user data",
        status: 500,
        originalError: error,
      } as AppError
    }
  }

  static async updateUserData(
    userId: string,
    updates: Partial<UserData>,
  ): Promise<{ success: boolean; error?: AppError }> {
    try {
      console.log(`[updateUserData] Updating profile for UID: ${userId} with updates:`, updates)

      if (!userId) {
        const error = createError(
          ErrorType.API_MISSING_PARAMS,
          null,
          { function: "updateUserData" },
          "User UID is required",
        )
        logError(error)
        return { success: false, error }
      }

      const userRef = doc(db, "users", userId)
      const [, updateError] = await tryCatch(
        () =>
          updateDoc(userRef, {
            ...updates,
            updatedAt: serverTimestamp(),
          }),
        ErrorType.DB_WRITE_FAILED,
        { function: "updateUserData", userId, updates },
      )

      if (updateError) {
        console.error(`[updateUserData] Error updating user document for ${userId}:`, updateError)
        return { success: false, error: updateError }
      }

      console.log(`[updateUserData] Successfully updated profile for UID: ${userId}`)
      return { success: true }
    } catch (error) {
      const appError = createError(
        ErrorType.UNKNOWN_ERROR,
        error,
        { function: "updateUserData", userId, updates },
        "Unexpected error updating user profile",
      )
      logError(appError)
      console.error(`[updateUserData] Unexpected error:`, error)
      return { success: false, error: appError }
    }
  }
}
