import { UnifiedAuthService } from "../services/unified-auth-service"
import { db } from "./firebase"
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore"

export interface UserProfile {
  uid: string
  email: string
  displayName?: string
  role: "trainer" | "client" | "admin"
  createdAt: Date
  updatedAt: Date
  isApproved?: boolean
  trainerCode?: string
}

export class UserService {
  private authService = new UnifiedAuthService()

  async createUserProfile(uid: string, userData: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(db, "users", uid)
      const now = new Date()

      const profile: UserProfile = {
        uid,
        email: userData.email || "",
        displayName: userData.displayName,
        role: userData.role || "trainer",
        createdAt: now,
        updatedAt: now,
        isApproved: userData.role === "trainer" ? false : true,
        ...userData,
      }

      await setDoc(userRef, profile)
    } catch (error) {
      console.error("Error creating user profile:", error)
      throw error
    }
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, "users", uid)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        const data = userSnap.data()
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as UserProfile
      }

      return null
    } catch (error) {
      console.error("Error getting user profile:", error)
      return null
    }
  }

  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(db, "users", uid)
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date(),
      })
    } catch (error) {
      console.error("Error updating user profile:", error)
      throw error
    }
  }

  async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const user = await this.authService.getCurrentUser()
      if (!user) return null

      return this.getUserProfile(user.uid)
    } catch (error) {
      console.error("Error getting current user profile:", error)
      return null
    }
  }

  async getUsersByRole(role: "trainer" | "client" | "admin"): Promise<UserProfile[]> {
    try {
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("role", "==", role))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as UserProfile
      })
    } catch (error) {
      console.error("Error getting users by role:", error)
      return []
    }
  }

  async approveUser(uid: string): Promise<void> {
    try {
      await this.updateUserProfile(uid, { isApproved: true })
    } catch (error) {
      console.error("Error approving user:", error)
      throw error
    }
  }
}

export const userService = new UserService()
