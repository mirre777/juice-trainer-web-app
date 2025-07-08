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
import { ErrorType, createError, logError, tryCatch } from "@/lib/utils/error-handler"

// Get current authenticated user
export async function getCurrentUser(): Promise<User | null> {
  return new Promise((resolve) => {
    const auth = getAuth()

    // If user is already available, return immediately
    if (auth.currentUser) {
      console.log("[getCurrentUser] User already available:", auth.currentUser.uid)
      resolve(auth.currentUser)
      return
    }

    // Otherwise, wait for auth state to be determined
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("[getCurrentUser] Auth state changed:", user?.uid || "null")
      unsubscribe() // Clean up the listener
      resolve(user)
    })
  })
}

// Get user data by email from Firestore
export async function getUserByEmail(email: string): Promise<any> {
  try {
    if (!email) {
      console.error("[getUserByEmail] No email provided")
      return null
    }

    console.log(`[getUserByEmail] 🔍 Searching for user with email: ${email}`)

    // Query users collection by email field
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("email", "==", email))

    console.log(`[getUserByEmail] 📋 Executing Firestore query...`)
    const querySnapshot = await getDocs(q)

    console.log(`[getUserByEmail] 📊 Query returned ${querySnapshot.size} documents`)

    if (querySnapshot.empty) {
      console.log(`[getUserByEmail] ❌ No user found with email: ${email}`)
      return null
    }

    // Get the first matching document
    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data()

    console.log(`[getUserByEmail] ✅ Found user:`, {
      id: userDoc.id,
      email: userData.email,
      hasFirebaseAuth: userData.hasFirebaseAuth || false,
      role: userData.role || "user",
    })

    return {
      id: userDoc.id,
      ...userData,
    }
  } catch (error: any) {
    console.error(`[getUserByEmail] ❌ Error fetching user data for ${email}:`, error)
    console.error(`[getUserByEmail] Error code:`, error.code)
    console.error(`[getUserByEmail] Error message:`, error.message)

    // Log specific Firestore errors
    if (error.code) {
      console.error(`[getUserByEmail] Firestore error details:`, {
        code: error.code,
        message: error.message,
        details: error.details || "No additional details",
      })
    }

    throw error // Re-throw to be handled by the calling function
  }
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

// Update user document
export async function updateUser(userId: string, updates: any): Promise<{ success: boolean; error?: any }> {
  try {
    if (!userId) {
      const error = createError(ErrorType.API_MISSING_PARAMS, null, { function: "updateUser" }, "User ID is required")
      logError(error)
      return { success: false, error }
    }

    console.log(`[updateUser] Updating user ${userId} with:`, updates)

    const userRef = doc(db, "users", userId)
    const [, updateError] = await tryCatch(
      () =>
        updateDoc(userRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        }),
      ErrorType.DB_WRITE_FAILED,
      { function: "updateUser", userId },
    )

    if (updateError) {
      console.error(`[updateUser] Failed to update user ${userId}:`, updateError)
      return { success: false, error: updateError }
    }

    console.log(`[updateUser] Successfully updated user ${userId}`)
    return { success: true }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "updateUser", userId },
      "Unexpected error updating user",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}

// Store invitation code for a user
export async function storeInvitationCode(
  userId: string,
  invitationCode: string,
): Promise<{ success: boolean; error?: any }> {
  try {
    console.log(`[storeInvitationCode] Storing invitation code ${invitationCode} for user ${userId}`)

    return await updateUser(userId, {
      inviteCode: invitationCode,
      inviteCodeStoredAt: new Date(),
    })
  } catch (error) {
    console.error(`[storeInvitationCode] Error storing invitation code:`, error)
    return { success: false, error }
  }
}

// Create or update user document
export async function createOrUpdateUser(userData: any): Promise<{ success: boolean; error?: any }> {
  try {
    if (!userData.id) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "createOrUpdateUser" },
        "User ID is required",
      )
      logError(error)
      return { success: false, error }
    }

    const userRef = doc(db, "users", userData.id)
    const [, updateError] = await tryCatch(
      () =>
        updateDoc(userRef, {
          ...userData,
          updatedAt: serverTimestamp(),
        }),
      ErrorType.DB_WRITE_FAILED,
      { function: "createOrUpdateUser", userId: userData.id },
    )

    if (updateError) {
      return { success: false, error: updateError }
    }

    return { success: true }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "createOrUpdateUser", userId: userData.id },
      "Unexpected error creating/updating user",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}

// Update user profile
export async function updateUserProfile(userId: string, updates: any): Promise<{ success: boolean; error?: any }> {
  try {
    if (!userId) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "updateUserProfile" },
        "User ID is required",
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
      { function: "updateUserProfile", userId },
    )

    if (updateError) {
      return { success: false, error: updateError }
    }

    return { success: true }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "updateUserProfile", userId },
      "Unexpected error updating user profile",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}

// Get all users (admin function)
export async function getAllUsers(): Promise<any[]> {
  try {
    const usersRef = collection(db, "users")
    const q = query(usersRef, orderBy("createdAt", "desc"))

    const [querySnapshot, error] = await tryCatch(() => getDocs(q), ErrorType.DB_READ_FAILED, {
      function: "getAllUsers",
    })

    if (error || !querySnapshot) {
      return []
    }

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
      const error = createError(ErrorType.API_MISSING_PARAMS, null, { function: "deleteUser" }, "User ID is required")
      logError(error)
      return { success: false, error }
    }

    const userRef = doc(db, "users", userId)
    const [, deleteError] = await tryCatch(() => deleteDoc(userRef), ErrorType.DB_DELETE_FAILED, {
      function: "deleteUser",
      userId,
    })

    if (deleteError) {
      return { success: false, error: deleteError }
    }

    return { success: true }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "deleteUser", userId },
      "Unexpected error deleting user",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}

// Subscribe to user changes
export function subscribeToUser(userId: string, callback: (userData: any, error?: any) => void) {
  if (!userId) {
    const error = createError(
      ErrorType.API_MISSING_PARAMS,
      null,
      { function: "subscribeToUser" },
      "User ID is required for subscription",
    )
    logError(error)
    callback(null, error)
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
        const appError = createError(
          ErrorType.DB_READ_FAILED,
          error,
          { function: "subscribeToUser", userId },
          "Error in user subscription",
        )
        logError(appError)
        callback(null, appError)
      },
    )

    return unsubscribe
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "subscribeToUser", userId },
      "Unexpected error setting up user subscription",
    )
    logError(appError)
    callback(null, appError)
    return () => {}
  }
}
