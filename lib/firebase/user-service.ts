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
import { db } from "@/lib/firebase/firebase"

// Get user by ID
export async function getUserById(userId: string) {
  try {
    console.log(`[getUserById] 🔍 Fetching user with ID: ${userId}`)
    const userDoc = await getDoc(doc(db, "users", userId))

    if (!userDoc.exists()) {
      console.log(`[getUserById] ❌ No user found with ID: ${userId}`)
      return null
    }

    const userData = userDoc.data()
    console.log(`[getUserById] ✅ Found user:`, {
      id: userDoc.id,
      email: userData.email,
      role: userData.role || "user",
    })

    return {
      id: userDoc.id,
      ...userData,
    }
  } catch (error: any) {
    console.error(`[getUserById] ❌ Error fetching user data for ${userId}:`, error)
    throw error
  }
}

// Get user by email - THIS WAS MISSING
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

// Update user - THIS WAS MISSING
export async function updateUser(userId: string, userData: any) {
  try {
    console.log(`[updateUser] 📝 Updating user ${userId}:`, userData)
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      ...userData,
      updatedAt: serverTimestamp(),
    })
    console.log(`[updateUser] ✅ User ${userId} updated successfully`)
    return true
  } catch (error: any) {
    console.error(`[updateUser] ❌ Error updating user ${userId}:`, error)
    throw error
  }
}

// Store invitation code - THIS WAS MISSING
export async function storeInvitationCode(userId: string, invitationCode: string) {
  try {
    console.log(`[storeInvitationCode] 💌 Storing invitation code for user ${userId}`)
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      invitationCode: invitationCode,
      invitationCodeStoredAt: serverTimestamp(),
    })
    console.log(`[storeInvitationCode] ✅ Invitation code stored for user ${userId}`)
    return true
  } catch (error: any) {
    console.error(`[storeInvitationCode] ❌ Error storing invitation code for ${userId}:`, error)
    // Don't throw error - this is not critical
    return false
  }
}

// Get current user data
export async function getCurrentUserData(userId: string) {
  try {
    console.log(`[getCurrentUserData] 🔍 Fetching current user data for: ${userId}`)
    const userDoc = await getDoc(doc(db, "users", userId))

    if (!userDoc.exists()) {
      console.log(`[getCurrentUserData] ❌ No user found with ID: ${userId}`)
      return null
    }

    const userData = userDoc.data()
    console.log(`[getCurrentUserData] ✅ Found current user:`, {
      id: userDoc.id,
      email: userData.email,
      role: userData.role || "user",
    })

    return {
      id: userDoc.id,
      ...userData,
    }
  } catch (error: any) {
    console.error(`[getCurrentUserData] ❌ Error fetching current user data:`, error)
    throw error
  }
}

// Delete user
export async function deleteUser(userId: string) {
  try {
    console.log(`[deleteUser] 🗑️ Deleting user: ${userId}`)
    await deleteDoc(doc(db, "users", userId))
    console.log(`[deleteUser] ✅ User ${userId} deleted successfully`)
    return true
  } catch (error: any) {
    console.error(`[deleteUser] ❌ Error deleting user ${userId}:`, error)
    throw error
  }
}

// Get all users (admin function)
export async function getAllUsers() {
  try {
    console.log(`[getAllUsers] 📋 Fetching all users`)
    const usersRef = collection(db, "users")
    const q = query(usersRef, orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)

    const users = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    console.log(`[getAllUsers] ✅ Found ${users.length} users`)
    return users
  } catch (error: any) {
    console.error(`[getAllUsers] ❌ Error fetching all users:`, error)
    throw error
  }
}

// Listen to user changes
export function listenToUserChanges(userId: string, callback: (userData: any) => void) {
  try {
    console.log(`[listenToUserChanges] 👂 Setting up listener for user: ${userId}`)
    const userRef = doc(db, "users", userId)

    return onSnapshot(
      userRef,
      (doc) => {
        if (doc.exists()) {
          const userData = { id: doc.id, ...doc.data() }
          console.log(`[listenToUserChanges] 🔄 User data changed:`, userData)
          callback(userData)
        } else {
          console.log(`[listenToUserChanges] ❌ User ${userId} no longer exists`)
          callback(null)
        }
      },
      (error) => {
        console.error(`[listenToUserChanges] ❌ Error listening to user changes:`, error)
      },
    )
  } catch (error: any) {
    console.error(`[listenToUserChanges] ❌ Error setting up user listener:`, error)
    throw error
  }
}
