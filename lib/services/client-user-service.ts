import { UnifiedAuthService } from "./unified-auth-service"
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { ErrorType, createError, logError, tryCatch } from "@/lib/utils/error-handler"

/**
 * Client User Service
 * Updated to use UnifiedAuthService for consistency
 */

export interface UserProfile {
  uid: string
  email: string
  name?: string
  role?: string
  phone?: string
  universalInviteCode?: string
  subscriptionPlan?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface UserUpdateData {
  name?: string
  phone?: string
  universalInviteCode?: string
  subscriptionPlan?: string
}

/**
 * Get current user profile
 */
export async function getCurrentUserProfile(): Promise<{ success: boolean; user?: UserProfile; error?: any }> {
  try {
    console.log("🔍 [ClientUserService] Getting current user profile...")

    // Use unified auth service
    const authResult = await UnifiedAuthService.getCurrentUser()

    if (!authResult.success || !authResult.user) {
      return { success: false, error: authResult.error }
    }

    const user = authResult.user
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      name: user.name,
      role: user.role,
      universalInviteCode: user.universalInviteCode,
    }

    console.log("✅ [ClientUserService] User profile retrieved successfully")
    return { success: true, user: userProfile }
  } catch (error: any) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "getCurrentUserProfile" },
      "Failed to get user profile",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(updates: UserUpdateData): Promise<{ success: boolean; error?: any }> {
  try {
    console.log("📝 [ClientUserService] Updating user profile...")

    // Get current user
    const authResult = await UnifiedAuthService.getCurrentUser()

    if (!authResult.success || !authResult.user) {
      return { success: false, error: authResult.error }
    }

    const userId = authResult.user.uid
    const userRef = doc(db, "users", userId)

    // Prepare update data
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    }

    // Update user document
    const [, updateError] = await tryCatch(() => updateDoc(userRef, updateData), ErrorType.DB_WRITE_FAILED, {
      function: "updateUserProfile",
      userId,
    })

    if (updateError) {
      return { success: false, error: updateError }
    }

    console.log("✅ [ClientUserService] User profile updated successfully")
    return { success: true }
  } catch (error: any) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "updateUserProfile" },
      "Failed to update user profile",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<{ success: boolean; user?: UserProfile; error?: any }> {
  try {
    console.log(`🔍 [ClientUserService] Getting user by ID: ${userId}`)

    const userRef = doc(db, "users", userId)
    const [userDoc, docError] = await tryCatch(() => getDoc(userRef), ErrorType.DB_READ_FAILED, {
      function: "getUserById",
      userId,
    })

    if (docError || !userDoc) {
      return { success: false, error: docError }
    }

    if (!userDoc.exists()) {
      return {
        success: false,
        error: createError(ErrorType.DB_DOCUMENT_NOT_FOUND, null, { userId }, "User not found"),
      }
    }

    const userData = userDoc.data()
    const userProfile: UserProfile = {
      uid: userId,
      email: userData.email || "",
      name: userData.name || "",
      role: userData.role,
      phone: userData.phone || "",
      universalInviteCode: userData.universalInviteCode || "",
      subscriptionPlan: userData.subscriptionPlan,
      createdAt: userData.createdAt?.toDate(),
      updatedAt: userData.updatedAt?.toDate(),
    }

    console.log("✅ [ClientUserService] User retrieved successfully")
    return { success: true, user: userProfile }
  } catch (error: any) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "getUserById", userId },
      "Failed to get user",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}

/**
 * Check if user has required permissions
 */
export async function checkUserPermissions(
  requiredRole?: string,
): Promise<{ success: boolean; hasPermission: boolean; error?: any }> {
  try {
    const authResult = await UnifiedAuthService.getCurrentUser()

    if (!authResult.success || !authResult.user) {
      return { success: false, hasPermission: false, error: authResult.error }
    }

    const user = authResult.user

    // If no specific role required, just check if authenticated
    if (!requiredRole) {
      return { success: true, hasPermission: true }
    }

    // Check if user has required role
    const hasPermission = user.role === requiredRole

    return { success: true, hasPermission }
  } catch (error: any) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "checkUserPermissions" },
      "Failed to check permissions",
    )
    logError(appError)
    return { success: false, hasPermission: false, error: appError }
  }
}
