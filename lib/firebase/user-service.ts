import { UnifiedAuthService } from "@/lib/services/unified-auth-service"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, getDoc, updateDoc, query, where, getDocs, collection, serverTimestamp } from "firebase/firestore"
import { auth, db } from "./firebase"
import { ErrorType, createError, logError, tryCatch } from "@/lib/utils/error-handler"

/**
 * Firebase User Service
 * Updated to use UnifiedAuthService for authentication operations
 * Keeps user creation and management functions
 */

export interface CreateUserData {
  email: string
  name: string
  password: string
  role?: string
  provider?: string
  phone?: string
}

export interface UserResult {
  success: boolean
  userId?: string
  user?: any
  error?: any
  message?: string
}

/**
 * Create a new user with email and password
 */
export async function createUser(userData: CreateUserData): Promise<UserResult> {
  try {
    console.log(`[UserService] 🚀 Creating user: ${userData.email}`)

    const { email, password, name, role, provider = "email", phone } = userData

    // Create Firebase Auth account
    const [userCredential, authError] = await tryCatch(
      () => createUserWithEmailAndPassword(auth, email, password),
      ErrorType.AUTH_INVALID_CREDENTIALS,
      { function: "createUser", email },
    )

    if (authError || !userCredential) {
      return { success: false, error: authError }
    }

    const firebaseUser = userCredential.user
    console.log(`[UserService] ✅ Firebase Auth account created: ${firebaseUser.uid}`)

    // Create user document in Firestore
    const userDocData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: role || "client",
      user_type: role === "trainer" ? "web_app" : "mobile_app",
      provider,
      phone: phone || "",
      hasFirebaseAuth: true,
      firebaseUid: firebaseUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: "active",
      ...(role === "trainer" && { subscriptionPlan: "trainer_basic" }),
    }

    const userRef = doc(db, "users", firebaseUser.uid)
    const [, docError] = await tryCatch(() => setDoc(userRef, userDocData), ErrorType.DB_WRITE_FAILED, {
      function: "createUser",
      userId: firebaseUser.uid,
    })

    if (docError) {
      // Clean up Firebase Auth account if Firestore creation fails
      try {
        await firebaseUser.delete()
      } catch (cleanupError) {
        console.error("[UserService] Failed to cleanup Firebase Auth account:", cleanupError)
      }
      return { success: false, error: docError }
    }

    console.log(`[UserService] ✅ User document created successfully`)
    return {
      success: true,
      userId: firebaseUser.uid,
      message: "User created successfully",
    }
  } catch (error: any) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "createUser", email: userData.email },
      "Failed to create user",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}

/**
 * Sign up with universal invite code
 */
export async function signupWithUniversalCode(data: {
  email: string
  name: string
  password: string
  universalInviteCode: string
}): Promise<UserResult> {
  try {
    console.log(`[UserService] 🎫 Signup with universal code: ${data.universalInviteCode}`)

    // Create user first
    const createResult = await createUser({
      email: data.email,
      name: data.name,
      password: data.password,
      role: undefined, // No role assigned initially
    })

    if (!createResult.success) {
      return createResult
    }

    // Store the invitation code in user document
    const userRef = doc(db, "users", createResult.userId!)
    await updateDoc(userRef, {
      universalInviteCode: data.universalInviteCode,
      pendingApproval: true,
      updatedAt: serverTimestamp(),
    })

    console.log(`[UserService] ✅ User created with universal invite code`)
    return {
      success: true,
      userId: createResult.userId,
      message: "Account created successfully. Waiting for trainer approval.",
    }
  } catch (error: any) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "signupWithUniversalCode" },
      "Failed to signup with universal code",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<{ success: boolean; user?: any; error?: any }> {
  try {
    console.log(`[UserService] 🔍 Getting user by email: ${email}`)

    const usersRef = collection(db, "users")
    const q = query(usersRef, where("email", "==", email.toLowerCase().trim()))

    const [querySnapshot, queryError] = await tryCatch(() => getDocs(q), ErrorType.DB_READ_FAILED, {
      function: "getUserByEmail",
      email,
    })

    if (queryError || !querySnapshot) {
      return { success: false, error: queryError }
    }

    if (querySnapshot.empty) {
      return {
        success: false,
        error: createError(ErrorType.DB_DOCUMENT_NOT_FOUND, null, { email }, "User not found"),
      }
    }

    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data()

    const user = {
      uid: userDoc.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      user_type: userData.user_type,
      universalInviteCode: userData.universalInviteCode,
      inviteCode: userData.inviteCode,
      ...userData,
    }

    console.log(`[UserService] ✅ User found: ${user.email}`)
    return { success: true, user }
  } catch (error: any) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "getUserByEmail", email },
      "Failed to get user by email",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<{ success: boolean; user?: any; error?: any }> {
  try {
    console.log(`[UserService] 🔍 Getting user by ID: ${userId}`)

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
    const user = {
      uid: userId,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      user_type: userData.user_type,
      universalInviteCode: userData.universalInviteCode,
      inviteCode: userData.inviteCode,
      ...userData,
    }

    console.log(`[UserService] ✅ User retrieved: ${user.email}`)
    return { success: true, user }
  } catch (error: any) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "getUserById", userId },
      "Failed to get user by ID",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, updates: any): Promise<UserResult> {
  try {
    console.log(`[UserService] 📝 Updating user profile: ${userId}`)

    const userRef = doc(db, "users", userId)
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    }

    const [, updateError] = await tryCatch(() => updateDoc(userRef, updateData), ErrorType.DB_WRITE_FAILED, {
      function: "updateUserProfile",
      userId,
    })

    if (updateError) {
      return { success: false, error: updateError }
    }

    console.log(`[UserService] ✅ User profile updated successfully`)
    return { success: true, message: "Profile updated successfully" }
  } catch (error: any) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "updateUserProfile", userId },
      "Failed to update user profile",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}

/**
 * @deprecated Use UnifiedAuthService.getCurrentUser() instead
 */
export async function getCurrentUser() {
  console.warn(
    "⚠️ [DEPRECATED] getCurrentUser() from user-service is deprecated. Use UnifiedAuthService.getCurrentUser() instead.",
  )
  return await UnifiedAuthService.getCurrentUser()
}

/**
 * @deprecated Use UnifiedAuthService.signIn() instead
 */
export async function signIn(email: string, password: string, invitationCode?: string) {
  console.warn("⚠️ [DEPRECATED] signIn() from user-service is deprecated. Use UnifiedAuthService.signIn() instead.")
  return await UnifiedAuthService.signIn(email, password, invitationCode)
}

/**
 * @deprecated Use UnifiedAuthService.signOut() instead
 */
export async function signOut() {
  console.warn("⚠️ [DEPRECATED] signOut() from user-service is deprecated. Use UnifiedAuthService.signOut() instead.")
  return await UnifiedAuthService.signOut()
}

// Re-export UnifiedAuthService functions for backward compatibility
export const UnifiedAuth = UnifiedAuthService
