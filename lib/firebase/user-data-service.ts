import { db } from "./firebase"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { createError, ErrorType, logError, type AppError } from "@/lib/utils/error-handler" // Corrected import
import type { UserProfile } from "@/types/index"

export async function getUserProfile(userId: string): Promise<[UserProfile | null, AppError | null]> {
  try {
    const docRef = doc(db, "userProfiles", userId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return [docSnap.data() as UserProfile, null]
    } else {
      return [null, null] // No profile found
    }
  } catch (error: any) {
    const appError = createError(
      ErrorType.DB_READ_FAILED,
      error,
      { service: "Firebase", operation: "getUserProfile", userId },
      "Failed to fetch user profile.",
    )
    logError(appError)
    return [null, appError]
  }
}

export async function createUserProfile(userId: string, profileData: UserProfile): Promise<[boolean, AppError | null]> {
  try {
    const docRef = doc(db, "userProfiles", userId)
    await setDoc(docRef, profileData)
    return [true, null]
  } catch (error: any) {
    const appError = createError(
      ErrorType.DB_WRITE_FAILED,
      error,
      { service: "Firebase", operation: "createUserProfile", userId, profileData },
      "Failed to create user profile.",
    )
    logError(appError)
    return [false, appError]
  }
}

export async function updateUserProfile(
  userId: string,
  profileData: Partial<UserProfile>,
): Promise<[boolean, AppError | null]> {
  try {
    const docRef = doc(db, "userProfiles", userId)
    await updateDoc(docRef, profileData)
    return [true, null]
  } catch (error: any) {
    const appError = createError(
      ErrorType.DB_WRITE_FAILED,
      error,
      { service: "Firebase", operation: "updateUserProfile", userId, profileData },
      "Failed to update user profile.",
    )
    logError(appError)
    return [false, appError]
  }
}
