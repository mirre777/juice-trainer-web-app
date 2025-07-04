import { UnifiedAuthService } from "../services/unified-auth-service"
import { db } from "./firebase"
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore"

export interface UserData {
  uid: string
  email: string
  name: string
  role: string
  createdAt: Date
  updatedAt: Date
}

/**
 * @deprecated Use UnifiedAuthService for auth operations
 * Firebase User Service for user document operations
 */
export class UserService {
  private authService = UnifiedAuthService

  async createUser(uid: string, userData: Partial<UserData>) {
    try {
      const userRef = doc(db, "users", uid)
      await setDoc(userRef, {
        ...userData,
        uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return { success: true }
    } catch (error) {
      console.error("Error creating user:", error)
      return { success: false, error }
    }
  }

  async getUserById(uid: string) {
    try {
      const userRef = doc(db, "users", uid)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        return { success: true, user: userDoc.data() }
      }

      return { success: false, error: "User not found" }
    } catch (error) {
      console.error("Error getting user:", error)
      return { success: false, error }
    }
  }

  async updateUser(uid: string, updates: Partial<UserData>) {
    try {
      const userRef = doc(db, "users", uid)
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      })
      return { success: true }
    } catch (error) {
      console.error("Error updating user:", error)
      return { success: false, error }
    }
  }

  async getUserByEmail(email: string) {
    try {
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("email", "==", email))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0]
        return { success: true, user: { id: userDoc.id, ...userDoc.data() } }
      }

      return { success: false, error: "User not found" }
    } catch (error) {
      console.error("Error getting user by email:", error)
      return { success: false, error }
    }
  }

  // Deprecated methods that redirect to UnifiedAuthService
  async getCurrentUser() {
    console.warn("⚠️ UserService.getCurrentUser is deprecated. Use UnifiedAuthService.getCurrentUser instead.")
    return await this.authService.getCurrentUser()
  }

  async signIn(email: string, password: string) {
    console.warn("⚠️ UserService.signIn is deprecated. Use UnifiedAuthService.signIn instead.")
    return await this.authService.signIn(email, password)
  }

  async signOut() {
    console.warn("⚠️ UserService.signOut is deprecated. Use UnifiedAuthService.signOut instead.")
    return await this.authService.signOut()
  }
}

export const userService = new UserService()
