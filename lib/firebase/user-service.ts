import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
  where,
} from "firebase/firestore"
import type { User } from "firebase/auth"
import { db } from "@/lib/firebase/firebase"
import { ErrorType, createError, logError, tryCatch } from "@/lib/utils/error-handler"
import { UnifiedAuthService } from "@/lib/services/unified-auth-service"

// UPDATED: Use UnifiedAuthService for current user operations
export async function getCurrentUser(): Promise<User | null> {
  console.warn("⚠️ DEPRECATED: getCurrentUser from user-service.ts. Use UnifiedAuthService.getCurrentUser() instead.")

  try {
    const authResult = await UnifiedAuthService.getCurrentUser()
    if (authResult.success && authResult.user) {
      // Return Firebase User-like object for backward compatibility
      return {
        uid: authResult.user.uid,
        email: authResult.user.email,
        displayName: authResult.user.name,
      } as User
    }
    return null
  } catch (error) {
    console.error("[getCurrentUser] Error:", error)
    return null
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

// Get user by email
export async function getUserByEmail(email: string): Promise<any> {
  try {
    if (!email) {
      console.error("[getUserByEmail] No email provided")
      return null
    }

    console.log(`[getUserByEmail] Searching for user with email: ${email}`)
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("email", "==", email.toLowerCase().trim()))

    const [querySnapshot, error] = await tryCatch(() => getDocs(q), ErrorType.DB_READ_FAILED, {
      function: "getUserByEmail",
      email,
    })

    if (error || !querySnapshot) {
      return null
    }

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0]
      const userData = userDoc.data()
      console.log(`[getUserByEmail] Found user:`, {
        id: userDoc.id,
        name: userData.name || "NO_NAME",
        email: userData.email || "NO_EMAIL",
      })
      return { id: userDoc.id, ...userData }
    }

    console.log(`[getUserByEmail] No user found with email: ${email}`)
    return null
  } catch (error) {
    console.error(`[getUserByEmail] Error searching for user with email ${email}:`, error)
    return null
  }
}

// UPDATED: Get current user's Firestore data using unified service
export async function getCurrentUserData(): Promise<any> {
  try {
    const authResult = await UnifiedAuthService.getCurrentUser()
    if (!authResult.success || !authResult.user) {
      console.log("[getCurrentUserData] No authenticated user")
      return null
    }

    return await getUserById(authResult.user.uid)
  } catch (error) {
    console.error("[getCurrentUserData] Error getting current user data:", error)
    return null
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

// Store invitation code for user
export async function storeInvitationCode(
  userId: string,
  invitationCode: string,
): Promise<{ success: boolean; error?: any }> {
  try {
    console.log(`[storeInvitationCode] Storing invitation code ${invitationCode} for user ${userId}`)

    const result = await updateUserProfile(userId, {
      inviteCode: invitationCode,
    })

    if (result.success) {
      console.log(`[storeInvitationCode] ✅ Successfully stored invitation code`)
    } else {
      console.error(`[storeInvitationCode] ❌ Failed to store invitation code:`, result.error)
    }

    return result
  } catch (error) {
    console.error(`[storeInvitationCode] Error storing invitation code:`, error)
    return { success: false, error }
  }
}

// Update user with new data
export async function updateUser(userId: string, updates: any): Promise<{ success: boolean; error?: any }> {
  return updateUserProfile(userId, updates)
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

// Export UnifiedAuthService for easy access
export { UnifiedAuthService }
