import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore"
import { getAuth, onAuthStateChanged, type User } from "firebase/auth"
import { db } from "@/lib/firebase/firebase"

// Get current authenticated user
export async function getCurrentUser(): Promise<User | null> {
  return new Promise((resolve) => {
    const auth = getAuth()

    if (auth.currentUser) {
      console.log("[getCurrentUser] User already available:", auth.currentUser.uid)
      resolve(auth.currentUser)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("[getCurrentUser] Auth state changed:", user?.uid || "null")
      unsubscribe()
      resolve(user)
    })
  })
}

// Get user data by ID from Firestore
export async function getUserById(userId: string): Promise<any> {
  try {
    if (!userId) {
      console.error("[getUserById] No user ID provided")
      return null
    }

    console.log(`[getUserById] Fetching user data for ID: ${userId}`)
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      const userData = userDoc.data()
      console.log(`[getUserById] Found user data:`, {
        id: userId,
        name: userData.name || "NO_NAME",
        email: userData.email || "NO_EMAIL",
      })
      return { id: userId, ...userData }
    } else {
      console.log(`[getUserById] User document does not exist for ID: ${userId}`)
      return null
    }
  } catch (error) {
    console.error(`[getUserById] Error fetching user data for ${userId}:`, error)
    return null
  }
}

// Get user data by email from Firestore
export async function getUserByEmail(email: string): Promise<any> {
  try {
    if (!email) {
      console.error("[getUserByEmail] No email provided")
      return null
    }

    console.log(`[getUserByEmail] 🔍 Searching for user with email: ${email}`)
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("email", "==", email))

    console.log(`[getUserByEmail] 📋 Executing Firestore query...`)
    const querySnapshot = await getDocs(q)
    console.log(`[getUserByEmail] 📊 Query returned ${querySnapshot.size} documents`)

    if (querySnapshot.empty) {
      console.log(`[getUserByEmail] ❌ No user found with email: ${email}`)
      return null
    }

    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data()

    console.log(`[getUserByEmail] ✅ Found user:`, {
      id: userDoc.id,
      email: userData.email,
      role: userData.role || "user",
      hasFirebaseAuth: userData.hasFirebaseAuth || false,
    })

    return {
      id: userDoc.id,
      ...userData,
    }
  } catch (error: any) {
    console.error(`[getUserByEmail] ❌ Error fetching user data for ${email}:`, error)
    throw error
  }
}

// Get current user's Firestore data
export async function getCurrentUserData(): Promise<any> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      console.log("[getCurrentUserData] No authenticated user")
      return null
    }

    return await getUserById(currentUser.uid)
  } catch (error) {
    console.error("[getCurrentUserData] Error getting current user data:", error)
    return null
  }
}

// Create or update user document
export async function createOrUpdateUser(userData: any): Promise<{ success: boolean; error?: any }> {
  try {
    if (!userData.id) {
      return { success: false, error: "User ID is required" }
    }

    const userRef = doc(db, "users", userData.id)
    await updateDoc(userRef, {
      ...userData,
      updatedAt: serverTimestamp(),
    })

    return { success: true }
  } catch (error) {
    console.error("Error creating/updating user:", error)
    return { success: false, error }
  }
}

// Update user profile
export async function updateUserProfile(userId: string, updates: any): Promise<{ success: boolean; error?: any }> {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" }
    }

    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })

    return { success: true }
  } catch (error) {
    console.error("Error updating user profile:", error)
    return { success: false, error }
  }
}

// Update user document
export async function updateUser(userId: string, updates: any): Promise<{ success: boolean; error?: any }> {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" }
    }

    const userRef = doc(db, "users", userId)
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

// Get all users (admin function)
export async function getAllUsers(): Promise<any[]> {
  try {
    const usersRef = collection(db, "users")
    const q = query(usersRef, orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)

    const users: any[] = []
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() })
    })

    return users
  } catch (error) {
    console.error("Error getting all users:", error)
    return []
  }
}

// Delete user
export async function deleteUser(userId: string): Promise<{ success: boolean; error?: any }> {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" }
    }

    const userRef = doc(db, "users", userId)
    await deleteDoc(userRef)

    return { success: true }
  } catch (error) {
    console.error("Error deleting user:", error)
    return { success: false, error }
  }
}

// Subscribe to user changes
export function subscribeToUser(userId: string, callback: (userData: any, error?: any) => void) {
  if (!userId) {
    callback(null, "User ID is required for subscription")
    return () => {}
  }

  try {
    const userRef = doc(db, "users", userId)

    const unsubscribe = onSnapshot(
      userRef,
      (doc) => {
        if (doc.exists()) {
          const userData = { id: doc.id, ...doc.data() }
          callback(userData)
        } else {
          callback(null)
        }
      },
      (error) => {
        console.error("Error in user subscription:", error)
        callback(null, error)
      },
    )

    return unsubscribe
  } catch (error) {
    console.error("Error setting up user subscription:", error)
    callback(null, error)
    return () => {}
  }
}

// Store invitation code for user
export async function storeInvitationCode(
  userId: string,
  invitationCode: string,
): Promise<{ success: boolean; error?: any }> {
  try {
    if (!userId || !invitationCode) {
      return { success: false, error: "User ID and invitation code are required" }
    }

    console.log(`[storeInvitationCode] Storing invitation code ${invitationCode} for user ${userId}`)

    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      inviteCode: invitationCode,
      inviteCodeStoredAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    console.log(`[storeInvitationCode] Successfully stored invitation code for user ${userId}`)
    return { success: true }
  } catch (error) {
    console.error("Error storing invitation code:", error)
    return { success: false, error }
  }
}
