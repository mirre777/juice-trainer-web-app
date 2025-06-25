import { db } from "@/lib/firebase/firebase"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import type { AppError } from "@/lib/utils/error-handler"

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
  static async getUserData(userId: string): Promise<UserData | null> {
    try {
      const userDocRef = doc(db, "users", userId)
      const userDocSnap = await getDoc(userDocRef)

      if (userDocSnap.exists()) {
        return userDocSnap.data() as UserData
      } else {
        return null
      }
    } catch (error: any) {
      console.error("Error getting user data:", error)
      throw {
        message: "Failed to get user data",
        status: 500,
        originalError: error,
      } as AppError
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

  static async updateUserData(userId: string, updates: Partial<UserData>): Promise<void> {
    try {
      const userDocRef = doc(db, "users", userId)
      await updateDoc(userDocRef, updates)
    } catch (error: any) {
      console.error("Error updating user data:", error)
      throw {
        message: "Failed to update user data",
        status: 500,
        originalError: error,
      } as AppError
    }
  }
}
