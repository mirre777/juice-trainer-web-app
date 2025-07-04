// Authentication service for handling login, signup, and session management

import { db } from "@/lib/firebase/firebase"
import { doc, setDoc } from "firebase/firestore"
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth"
import { cookies } from "next/headers"
import { ErrorType, createError, logError, tryCatch } from "@/lib/utils/error-handler"
import { UnifiedAuthService } from "@/lib/services/unified-auth-service"

console.warn("⚠️ DEPRECATED: lib/auth/auth-service.ts is deprecated. Please use UnifiedAuthService instead.")

// Sign in with email and password
export async function signIn(email: string, password: string, invitationCode?: string) {
  console.warn("⚠️ DEPRECATED: signIn from auth-service.ts. Use UnifiedAuthService.signIn() instead.")
  return UnifiedAuthService.signIn(email, password, invitationCode)
}

// Sign up with email and password
export async function signUp(email: string, password: string, userData: any) {
  try {
    // Validate input
    if (!email || !password || !userData) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "signUp" },
        "Email, password, and user data are required",
      )
      logError(error)
      return { success: false, error }
    }

    const auth = getAuth()
    const [userCredential, authError] = await tryCatch(
      () => createUserWithEmailAndPassword(auth, email, password),
      ErrorType.AUTH_EMAIL_IN_USE,
      { function: "signUp", email },
    )

    if (authError || !userCredential) {
      return { success: false, error: authError }
    }

    const user = userCredential.user

    // Create user document in Firestore
    const [, docError] = await tryCatch(
      () =>
        setDoc(doc(db, "users", user.uid), {
          email: user.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          createdAt: new Date(),
          ...userData,
        }),
      ErrorType.DB_WRITE_FAILED,
      { function: "signUp", uid: user.uid },
    )

    if (docError) {
      // This is critical, but we've already created the auth user
      logError(docError)
      return { success: false, error: docError }
    }

    // Set auth cookie
    const [token, tokenError] = await tryCatch(() => user.getIdToken(), ErrorType.AUTH_TOKEN_EXPIRED, {
      function: "signUp",
      uid: user.uid,
    })

    if (tokenError || !token) {
      return { success: false, error: tokenError }
    }

    cookies().set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    return { success: true, user }
  } catch (error: any) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "signUp", email },
      "Unexpected error during sign up",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}

// Sign out
export async function signOut() {
  console.warn("⚠️ DEPRECATED: signOut from auth-service.ts. Use UnifiedAuthService.signOut() instead.")
  return UnifiedAuthService.signOut()
}

// Get current user
export async function getCurrentUser() {
  console.warn("⚠️ DEPRECATED: getCurrentUser from auth-service.ts. Use UnifiedAuthService.getCurrentUser() instead.")
  return UnifiedAuthService.getCurrentUser()
}

// Check if user is authenticated
export const isAuthenticated = async () => {
  console.warn("⚠️ DEPRECATED: isAuthenticated from auth-service.ts. Use UnifiedAuthService.isAuthenticated() instead.")
  return UnifiedAuthService.isAuthenticated()
}
