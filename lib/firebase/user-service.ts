import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"
import { getAuth } from "firebase/auth"

export interface User {
  id: string
  email: string
  name: string
  role: "user" | "trainer" | "admin"
  isApproved: boolean
  status?: "pending_approval" | "approved" | "rejected"
  invitationCode?: string
  hasFirebaseAuth?: boolean
  firebaseUid?: string
  createdAt?: Date | Timestamp
  updatedAt?: Date | Timestamp
  linkedAt?: Date | Timestamp
  linkedDuring?: string
  migratedAt?: Date | Timestamp
  inviteCode?: string
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    console.log(`[getUserByEmail] Searching for user with email: ${email}`)

    const usersRef = collection(db, "users")
    const q = query(usersRef, where("email", "==", email))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log(`[getUserByEmail] No user found with email: ${email}`)
      return null
    }

    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data() as User
    userData.id = userDoc.id

    console.log(`[getUserByEmail] Found user:`, {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      isApproved: userData.isApproved,
    })

    return userData
  } catch (error) {
    console.error("[getUserByEmail] Error:", error)
    throw error
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const auth = getAuth()
    const firebaseUser = auth.currentUser

    if (!firebaseUser) {
      console.log("[getCurrentUser] No authenticated user")
      return null
    }

    console.log(`[getCurrentUser] Getting current user: ${firebaseUser.email}`)
    return await getUserByEmail(firebaseUser.email!)
  } catch (error) {
    console.error("[getCurrentUser] Error:", error)
    return null
  }
}

export async function getCurrentUserData(): Promise<User | null> {
  try {
    const auth = getAuth()
    const firebaseUser = auth.currentUser

    if (!firebaseUser) {
      console.log("[getCurrentUserData] No authenticated user")
      return null
    }

    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))

    if (!userDoc.exists()) {
      console.log("[getCurrentUserData] User document not found")
      return null
    }

    const userData = userDoc.data() as User
    userData.id = userDoc.id

    return userData
  } catch (error) {
    console.error("[getCurrentUserData] Error:", error)
    return null
  }
}

export async function updateUser(
  userId: string,
  updates: Partial<User>,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[updateUser] Updating user ${userId} with:`, updates)

    const userRef = doc(db, "users", userId)
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    }

    await updateDoc(userRef, updateData)

    console.log(`[updateUser] Successfully updated user: ${userId}`)
    return { success: true }
  } catch (error: any) {
    console.error("[updateUser] Error:", error)
    return { success: false, error: error.message }
  }
}

export async function storeInvitationCode(
  userId: string,
  invitationCode: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[storeInvitationCode] Storing invitation code ${invitationCode} for user ${userId}`)

    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      invitationCode: invitationCode,
      invitationStoredAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    console.log(`[storeInvitationCode] Successfully stored invitation code for user: ${userId}`)
    return { success: true }
  } catch (error: any) {
    console.error("[storeInvitationCode] Error:", error)
    return { success: false, error: error.message }
  }
}

export async function signupWithUniversalCode(
  email: string,
  password: string,
  name: string,
  universalCode: string,
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    console.log(`[signupWithUniversalCode] Signing up user with universal code: ${email}`)

    // Check if universal code is valid (you can implement your own logic here)
    const validCodes = ["TRAINER2024", "UNIVERSAL", "ADMIN"]
    if (!validCodes.includes(universalCode)) {
      return { success: false, error: "Invalid universal code" }
    }

    // Create user document
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const userData: User = {
      id: userId,
      email,
      name,
      role: universalCode === "ADMIN" ? "admin" : "trainer",
      isApproved: true,
      status: "approved",
      hasFirebaseAuth: true,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    }

    const userRef = doc(db, "users", userId)
    await setDoc(userRef, userData)

    console.log(`[signupWithUniversalCode] Successfully created user: ${userId}`)
    return { success: true, user: userData }
  } catch (error: any) {
    console.error("[signupWithUniversalCode] Error:", error)
    return { success: false, error: error.message }
  }
}

export async function approveUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[approveUser] Approving user: ${userId}`)

    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      isApproved: true,
      status: "approved",
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    console.log(`[approveUser] Successfully approved user: ${userId}`)
    return { success: true }
  } catch (error: any) {
    console.error("[approveUser] Error:", error)
    return { success: false, error: error.message }
  }
}

export async function getPendingUsers(): Promise<User[]> {
  try {
    console.log("[getPendingUsers] Getting pending users")

    const usersRef = collection(db, "users")
    const q = query(usersRef, where("status", "==", "pending_approval"), orderBy("createdAt", "desc"))

    const querySnapshot = await getDocs(q)
    const users: User[] = []

    querySnapshot.forEach((doc) => {
      const userData = doc.data() as User
      userData.id = doc.id
      users.push(userData)
    })

    console.log(`[getPendingUsers] Found ${users.length} pending users`)
    return users
  } catch (error) {
    console.error("[getPendingUsers] Error:", error)
    return []
  }
}

export async function updateUniversalInviteCode(newCode: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[updateUniversalInviteCode] Updating universal invite code to: ${newCode}`)

    // Store in a settings document
    const settingsRef = doc(db, "settings", "universal")
    await setDoc(
      settingsRef,
      {
        inviteCode: newCode,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )

    console.log("[updateUniversalInviteCode] Successfully updated universal invite code")
    return { success: true }
  } catch (error: any) {
    console.error("[updateUniversalInviteCode] Error:", error)
    return { success: false, error: error.message }
  }
}

export async function createUser(
  userData: Omit<User, "id" | "createdAt" | "updatedAt">,
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newUser: User = {
      ...userData,
      id: userId,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    }

    const userRef = doc(db, "users", userId)
    await setDoc(userRef, newUser)

    console.log(`[createUser] Successfully created user: ${userId}`)
    return { success: true, user: newUser }
  } catch (error: any) {
    console.error("[createUser] Error:", error)
    return { success: false, error: error.message }
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    console.log(`[getUserById] Getting user: ${userId}`)

    const userDoc = await getDoc(doc(db, "users", userId))

    if (!userDoc.exists()) {
      console.log(`[getUserById] User not found: ${userId}`)
      return null
    }

    const userData = userDoc.data() as User
    userData.id = userDoc.id

    return userData
  } catch (error) {
    console.error("[getUserById] Error:", error)
    return null
  }
}
