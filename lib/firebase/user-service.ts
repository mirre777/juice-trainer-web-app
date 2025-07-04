/**
 * Firebase User Service
 * Handles user-related Firebase operations
 * Updated to use UnifiedAuthService for authentication operations
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"
import { UnifiedAuthService } from "../services/unified-auth-service"
import type { User } from "@/types/index"

export interface UserProfile {
  uid: string
  email: string
  name: string
  role: "trainer" | "client"
  createdAt: Timestamp
  updatedAt: Timestamp
  isActive: boolean
  profilePicture?: string
  phone?: string
  bio?: string
  specializations?: string[]
  certifications?: string[]
}

export class UserService {
  private static instance: UserService
  private authService: UnifiedAuthService

  private constructor() {
    this.authService = UnifiedAuthService.getInstance()
    console.warn("UserService is deprecated. Use UnifiedAuthService for auth operations.")
  }

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService()
    }
    return UserService.instance
  }

  /**
   * Create a new user profile in Firestore
   */
  async createUserProfile(userData: Partial<UserProfile>): Promise<void> {
    try {
      if (!userData.uid) {
        throw new Error("User ID is required to create profile")
      }

      const userRef = doc(db, "users", userData.uid)
      const profileData: UserProfile = {
        uid: userData.uid,
        email: userData.email || "",
        name: userData.name || "",
        role: userData.role || "client",
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        isActive: true,
        ...userData,
      }

      await setDoc(userRef, profileData)
      console.log("User profile created successfully:", userData.uid)
    } catch (error) {
      console.error("Error creating user profile:", error)
      throw error
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, "users", userId)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        return userSnap.data() as UserProfile
      }
      return null
    } catch (error) {
      console.error("Error getting user profile:", error)
      throw error
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(db, "users", userId)
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      }

      await updateDoc(userRef, updateData)
      console.log("User profile updated successfully:", userId)
    } catch (error) {
      console.error("Error updating user profile:", error)
      throw error
    }
  }

  /**
   * Delete user profile
   */
  async deleteUserProfile(userId: string): Promise<void> {
    try {
      const userRef = doc(db, "users", userId)
      await deleteDoc(userRef)
      console.log("User profile deleted successfully:", userId)
    } catch (error) {
      console.error("Error deleting user profile:", error)
      throw error
    }
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: "trainer" | "client"): Promise<UserProfile[]> {
    try {
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("role", "==", role), where("isActive", "==", true))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => doc.data() as UserProfile)
    } catch (error) {
      console.error("Error getting users by role:", error)
      throw error
    }
  }

  /**
   * Search users by email
   */
  async searchUsersByEmail(email: string): Promise<UserProfile[]> {
    try {
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("email", "==", email))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => doc.data() as UserProfile)
    } catch (error) {
      console.error("Error searching users by email:", error)
      throw error
    }
  }

  /**
   * Subscribe to user profile changes
   */
  subscribeToUserProfile(userId: string, callback: (profile: UserProfile | null) => void): () => void {
    const userRef = doc(db, "users", userId)

    return onSnapshot(
      userRef,
      (doc) => {
        if (doc.exists()) {
          callback(doc.data() as UserProfile)
        } else {
          callback(null)
        }
      },
      (error) => {
        console.error("Error in user profile subscription:", error)
        callback(null)
      },
    )
  }

  /**
   * Get current user profile (uses UnifiedAuthService for auth)
   */
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const currentUser = await this.authService.getCurrentUser()
      if (!currentUser) {
        return null
      }

      return await this.getUserProfile(currentUser.uid)
    } catch (error) {
      console.error("Error getting current user profile:", error)
      return null
    }
  }

  /**
   * Update current user profile (uses UnifiedAuthService for auth)
   */
  async updateCurrentUserProfile(updates: Partial<UserProfile>): Promise<void> {
    try {
      const currentUser = await this.authService.getCurrentUser()
      if (!currentUser) {
        throw new Error("No authenticated user found")
      }

      await this.updateUserProfile(currentUser.uid, updates)
    } catch (error) {
      console.error("Error updating current user profile:", error)
      throw error
    }
  }

  /**
   * Check if user exists
   */
  async userExists(userId: string): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(userId)
      return profile !== null
    } catch (error) {
      console.error("Error checking if user exists:", error)
      return false
    }
  }

  /**
   * Deactivate user (soft delete)
   */
  async deactivateUser(userId: string): Promise<void> {
    try {
      await this.updateUserProfile(userId, {
        isActive: false,
        updatedAt: serverTimestamp() as Timestamp,
      })
      console.log("User deactivated successfully:", userId)
    } catch (error) {
      console.error("Error deactivating user:", error)
      throw error
    }
  }

  /**
   * Reactivate user
   */
  async reactivateUser(userId: string): Promise<void> {
    try {
      await this.updateUserProfile(userId, {
        isActive: true,
        updatedAt: serverTimestamp() as Timestamp,
      })
      console.log("User reactivated successfully:", userId)
    } catch (error) {
      console.error("Error reactivating user:", error)
      throw error
    }
  }

  async getCurrentUser(): Promise<User | null> {
    return this.authService.getCurrentUser()
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, "users", userId))
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as User
      }
      return null
    } catch (error) {
      console.error("Error getting user:", error)
      throw error
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    try {
      await updateDoc(doc(db, "users", userId), updates)
    } catch (error) {
      console.error("Error updating user:", error)
      throw error
    }
  }

  async createUser(userId: string, userData: Partial<User>): Promise<void> {
    try {
      await setDoc(doc(db, "users", userId), {
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    } catch (error) {
      console.error("Error creating user:", error)
      throw error
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "users", userId))
    } catch (error) {
      console.error("Error deleting user:", error)
      throw error
    }
  }

  async getUsersByRole(role: string): Promise<User[]> {
    try {
      const q = query(collection(db, "users"), where("role", "==", role))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as User)
    } catch (error) {
      console.error("Error getting users by role:", error)
      throw error
    }
  }
}

// Export singleton instance
export const userService = UserService.getInstance()
