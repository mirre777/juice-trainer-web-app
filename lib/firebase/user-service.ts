import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "./firebase"

export interface User {
  uid: string
  email: string
  name?: string
  role?: string
  user_type?: string
  universalInviteCode?: string
  inviteCode?: string
  createdAt?: any
  updatedAt?: any
}

// Fixed getUserByEmail function
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    console.log(`[UserService] 🔍 Getting user by email: ${email}`)

    if (!email) {
      console.log(`[UserService] ❌ No email provided`)
      return null
    }

    // Query users collection by email
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("email", "==", email))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log(`[UserService] ❌ No user found with email: ${email}`)
      return null
    }

    // Get the first matching user
    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data()

    const user: User = {
      uid: userDoc.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      user_type: userData.user_type,
      universalInviteCode: userData.universalInviteCode,
      inviteCode: userData.inviteCode,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    }

    console.log(`[UserService] ✅ User found:`, { uid: user.uid, email: user.email, role: user.role })
    return user
  } catch (error) {
    console.error(`[UserService] ❌ Error getting user by email:`, error)
    throw error
  }
}

// Other user service functions...
export async function getUserById(uid: string): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", uid))

    if (!userDoc.exists()) {
      return null
    }

    const userData = userDoc.data()
    return {
      uid: userDoc.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      user_type: userData.user_type,
      universalInviteCode: userData.universalInviteCode,
      inviteCode: userData.inviteCode,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    }
  } catch (error) {
    console.error("Error getting user by ID:", error)
    throw error
  }
}

export async function createUser(userData: Partial<User>): Promise<User> {
  try {
    const userRef = doc(db, "users", userData.uid!)
    const newUser = {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    await setDoc(userRef, newUser)
    return newUser as User
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

export async function updateUser(uid: string, updates: Partial<User>): Promise<void> {
  try {
    const userRef = doc(db, "users", uid)
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating user:", error)
    throw error
  }
}

export async function deleteUser(uid: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "users", uid))
  } catch (error) {
    console.error("Error deleting user:", error)
    throw error
  }
}
