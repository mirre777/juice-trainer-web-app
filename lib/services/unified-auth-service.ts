import { cookies } from "next/headers"
import { signInWithEmailAndPassword, signOut } from "firebase/auth"
import { auth, db } from "@/lib/firebase/firebase"
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { ErrorType, createError, logError, tryCatch } from "@/lib/utils/error-handler"

export interface AuthUser {
  uid: string
  email: string
  name?: string
  role?: string
  user_type?: string
  universalInviteCode?: string
  inviteCode?: string
}

export interface AuthResult {
  success: boolean
  user?: AuthUser
  error?: any
  message?: string
}

/**
 * Unified Authentication Service
 * Single source of truth for all authentication operations
 */
export class UnifiedAuthService {
  /**
   * Get current user from cookies and validate with Firestore
   */
  static async getCurrentUser(): Promise<AuthResult> {
    try {
      console.log("🔍 [UnifiedAuth] Getting current user...")

      const cookieStore = await cookies()
      const userId = cookieStore.get("user_id")?.value

      if (!userId) {
        console.log("❌ [UnifiedAuth] No user_id in cookies")
        return {
          success: false,
          error: createError(ErrorType.AUTH_UNAUTHORIZED, null, { function: "getCurrentUser" }, "Not authenticated"),
        }
      }

      // Get user data from Firestore
      const userRef = doc(db, "users", userId)
      const [userDoc, docError] = await tryCatch(() => getDoc(userRef), ErrorType.DB_READ_FAILED, {
        function: "getCurrentUser",
        userId,
      })

      if (docError || !userDoc) {
        return { success: false, error: docError }
      }

      if (!userDoc.exists()) {
        console.log("❌ [UnifiedAuth] User document not found for ID:", userId)
        return {
          success: false,
          error: createError(ErrorType.DB_DOCUMENT_NOT_FOUND, null, { userId }, "User not found"),
        }
      }

      const userData = userDoc.data()
      const user: AuthUser = {
        uid: userId,
        email: userData?.email || "",
        name: userData?.name || "",
        role: userData?.role,
        user_type: userData?.user_type,
        universalInviteCode: userData?.universalInviteCode || "",
        inviteCode: userData?.inviteCode || "",
      }

      console.log("✅ [UnifiedAuth] Current user retrieved:", { uid: user.uid, email: user.email, role: user.role })
      return { success: true, user }
    } catch (error: any) {
      const appError = createError(
        ErrorType.UNKNOWN_ERROR,
        error,
        { function: "getCurrentUser" },
        "Unexpected error getting current user",
      )
      logError(appError)
      return { success: false, error: appError }
    }
  }

  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string, inviteCode?: string): Promise<AuthResult> {
    try {
      console.log(`[UnifiedAuth] 🚀 Processing login for ${email}`)

      if (!email || !password) {
        return {
          success: false,
          error: createError(
            ErrorType.API_MISSING_PARAMS,
            null,
            { function: "signIn" },
            "Email and password are required",
          ),
        }
      }

      // Check if user exists in Firestore first
      const { user: existingUser } = await this.getUserByEmail(email)

      if (!existingUser) {
        console.log(`[UnifiedAuth] ❌ User not found in Firestore: ${email}`)
        if (inviteCode) {
          return {
            success: false,
            error: createError(
              ErrorType.DB_DOCUMENT_NOT_FOUND,
              null,
              { email },
              "Account not found. Please sign up first.",
            ),
            message: "Account not found. Please sign up first.",
          }
        }
        return {
          success: false,
          error: createError(
            ErrorType.DB_DOCUMENT_NOT_FOUND,
            null,
            { email },
            "No account found with this email address",
          ),
        }
      }

      // Authenticate with Firebase
      const [userCredential, authError] = await tryCatch(
        () => signInWithEmailAndPassword(auth, email, password),
        ErrorType.AUTH_INVALID_CREDENTIALS,
        { function: "signIn", email },
      )

      if (authError || !userCredential) {
        return { success: false, error: authError }
      }

      const firebaseUser = userCredential.user
      const [token, tokenError] = await tryCatch(() => firebaseUser.getIdToken(), ErrorType.AUTH_TOKEN_EXPIRED, {
        function: "signIn",
        uid: firebaseUser.uid,
      })

      if (tokenError || !token) {
        return { success: false, error: tokenError }
      }

      // Set cookies
      this.setAuthCookies(token, existingUser.uid)

      // Process invitation if provided
      if (inviteCode) {
        console.log(`[UnifiedAuth] Processing invitation code: ${inviteCode}`)
        // Store invitation code and process it
        await this.storeInviteCode(existingUser.uid, inviteCode)
        // Import and process the invitation
        const { processLoginInvitation } = await import("@/lib/firebase/client-service")
        await processLoginInvitation(inviteCode, existingUser.uid)
      }

      console.log(`[UnifiedAuth] ✅ Login successful for user: ${existingUser.uid}`)
      return {
        success: true,
        user: existingUser,
        message: inviteCode ? "Login successful! Your request has been sent to the trainer." : "Login successful!",
      }
    } catch (error: any) {
      const appError = createError(
        ErrorType.UNKNOWN_ERROR,
        error,
        { function: "signIn", email },
        "Unexpected error during sign in",
      )
      logError(appError)
      return { success: false, error: appError }
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<AuthResult> {
    try {
      console.log("[UnifiedAuth] 🚪 Signing out user...")

      // Sign out from Firebase
      const [, authError] = await tryCatch(() => signOut(auth), ErrorType.AUTH_UNAUTHORIZED, {
        function: "signOut",
      })

      if (authError) {
        logError(authError)
      }

      // Clear cookies
      this.clearAuthCookies()

      console.log("[UnifiedAuth] ✅ Sign out successful")
      return { success: true, message: "Signed out successfully" }
    } catch (error: any) {
      const appError = createError(
        ErrorType.UNKNOWN_ERROR,
        error,
        { function: "signOut" },
        "Unexpected error during sign out",
      )
      logError(appError)
      return { success: false, error: appError }
    }
  }

  /**
   * Get user by email
   */
  private static async getUserByEmail(email: string): Promise<{ user?: AuthUser; error?: any }> {
    try {
      // This would need to be implemented based on your existing getUserByEmail function
      // For now, returning a placeholder
      return { user: undefined }
    } catch (error) {
      return { error }
    }
  }

  /**
   * Store invitation code for user
   */
  private static async storeInviteCode(userId: string, inviteCode: string): Promise<void> {
    try {
      const userRef = doc(db, "users", userId)
      await updateDoc(userRef, {
        inviteCode: inviteCode,
        updatedAt: serverTimestamp(),
      })
      console.log(`[UnifiedAuth] ✅ Stored invitation code for user: ${userId}`)
    } catch (error) {
      console.error(`[UnifiedAuth] ❌ Failed to store invitation code:`, error)
    }
  }

  /**
   * Set authentication cookies
   */
  private static async setAuthCookies(token: string, userId: string): Promise<void> {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    }
    const cookieStore = await cookies()
    cookieStore.set("auth_token", token, cookieOptions)
    cookieStore.set("user_id", userId, { ...cookieOptions, httpOnly: false })
  }

  /**
   * Clear authentication cookies
   */
  private static async clearAuthCookies(): Promise<void> {
    const cookieOptions = {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
    }
    const cookieStore = await cookies()
    cookieStore.set("auth_token", "", cookieOptions)
    cookieStore.set("user_id", "", { ...cookieOptions, httpOnly: false })
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    const result = await this.getCurrentUser()
    return result.success && !!result.user
  }

  /**
   * Get user ID from cookies
   */
  static getUserIdFromCookies(): string | null {
    const cookieStore = cookies()
    return cookieStore.get("user_id")?.value || null
  }
}
