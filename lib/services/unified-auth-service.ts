import { cookies } from "next/headers"
import { signInWithEmailAndPassword, signOut } from "firebase/auth"
import { auth, db } from "@/lib/firebase/firebase"
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore"
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

      const cookieStore = cookies()
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
   * Get user by email from Firestore
   */
  private static async getUserByEmail(email: string): Promise<{ user?: AuthUser; error?: any }> {
    try {
      console.log(`[UnifiedAuth] Looking up user by email: ${email}`)

      const usersRef = collection(db, "users")
      const q = query(usersRef, where("email", "==", email.toLowerCase().trim()))

      const [querySnapshot, queryError] = await tryCatch(() => getDocs(q), ErrorType.DB_READ_FAILED, {
        function: "getUserByEmail",
        email,
      })

      if (queryError || !querySnapshot) {
        return { error: queryError }
      }

      if (querySnapshot.empty) {
        console.log(`[UnifiedAuth] No user found with email: ${email}`)
        return { user: undefined }
      }

      const userDoc = querySnapshot.docs[0]
      const userData = userDoc.data()

      const user: AuthUser = {
        uid: userDoc.id,
        email: userData.email || "",
        name: userData.name || "",
        role: userData.role,
        user_type: userData.user_type,
        universalInviteCode: userData.universalInviteCode || "",
        inviteCode: userData.inviteCode || "",
      }

      console.log(`[UnifiedAuth] Found user:`, { uid: user.uid, email: user.email, role: user.role })
      return { user }
    } catch (error) {
      const appError = createError(
        ErrorType.UNKNOWN_ERROR,
        error,
        { function: "getUserByEmail", email },
        "Error looking up user by email",
      )
      logError(appError)
      return { error: appError }
    }
  }

  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string, invitationCode?: string): Promise<AuthResult> {
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
      const { user: existingUser, error: lookupError } = await this.getUserByEmail(email)

      if (lookupError) {
        return { success: false, error: lookupError }
      }

      if (!existingUser) {
        console.log(`[UnifiedAuth] ❌ User not found in Firestore: ${email}`)
        if (invitationCode) {
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
      if (invitationCode) {
        console.log(`[UnifiedAuth] Processing invitation code: ${invitationCode}`)
        // Store invitation code and process it
        await this.storeInvitationCode(existingUser.uid, invitationCode)
        // Import and process the invitation
        const { processLoginInvitation } = await import("@/lib/firebase/client-service")
        await processLoginInvitation(invitationCode, existingUser.uid)
      }

      console.log(`[UnifiedAuth] ✅ Login successful for user: ${existingUser.uid}`)
      return {
        success: true,
        user: existingUser,
        message: invitationCode ? "Login successful! Your request has been sent to the trainer." : "Login successful!",
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
   * Store invitation code for user
   */
  private static async storeInvitationCode(userId: string, invitationCode: string): Promise<void> {
    try {
      const userRef = doc(db, "users", userId)
      await updateDoc(userRef, {
        inviteCode: invitationCode,
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
  private static setAuthCookies(token: string, userId: string): void {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    }

    cookies().set("auth_token", token, cookieOptions)
    cookies().set("user_id", userId, { ...cookieOptions, httpOnly: false })
  }

  /**
   * Clear authentication cookies
   */
  private static clearAuthCookies(): void {
    const cookieOptions = {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
    }

    cookies().set("auth_token", "", cookieOptions)
    cookies().set("user_id", "", { ...cookieOptions, httpOnly: false })
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
