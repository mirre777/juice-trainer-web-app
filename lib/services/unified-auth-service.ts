import { auth, db } from "@/lib/firebase/firebase"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { ErrorType, createError, logError, tryCatch } from "@/lib/utils/error-handler"

export interface AuthUser {
  uid: string
  email: string | null
  name?: string
  role?: string
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
 * Uses Firebase Auth with consistent error handling
 */
export class UnifiedAuthService {
  private static currentUser: AuthUser | null = null
  private static authStateListeners: ((user: AuthUser | null) => void)[] = []

  /**
   * Initialize auth state listener
   */
  static initialize(): void {
    console.log("[UnifiedAuth] 🚀 Initializing authentication service...")

    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log("[UnifiedAuth] 👤 User signed in:", firebaseUser.email)

        // Get additional user data from Firestore
        const userData = await this.getUserData(firebaseUser.uid)

        this.currentUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: userData?.name || firebaseUser.displayName || undefined,
          role: userData?.role || "user",
        }
      } else {
        console.log("[UnifiedAuth] 👤 User signed out")
        this.currentUser = null
      }

      // Notify all listeners
      this.authStateListeners.forEach((listener) => listener(this.currentUser))
    })
  }

  /**
   * Get current authenticated user
   */
  static async getCurrentUser(): Promise<AuthResult> {
    try {
      // Return cached user if available
      if (this.currentUser) {
        return { success: true, user: this.currentUser }
      }

      // Wait for auth state to be determined
      return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          unsubscribe()

          if (firebaseUser) {
            const userData = await this.getUserData(firebaseUser.uid)
            const user: AuthUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: userData?.name || firebaseUser.displayName || undefined,
              role: userData?.role || "user",
            }

            this.currentUser = user
            resolve({ success: true, user })
          } else {
            resolve({
              success: false,
              error: createError(
                ErrorType.AUTH_UNAUTHORIZED,
                null,
                { function: "getCurrentUser" },
                "No authenticated user",
              ),
            })
          }
        })
      })
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
  static async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      console.log("[UnifiedAuth] 🔐 Signing in user:", email)

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

      const [userCredential, signInError] = await tryCatch(
        () => signInWithEmailAndPassword(auth, email, password),
        ErrorType.AUTH_INVALID_CREDENTIALS,
        { function: "signIn", email },
      )

      if (signInError || !userCredential) {
        return { success: false, error: signInError }
      }

      // Get user data from Firestore
      const userData = await this.getUserData(userCredential.user.uid)

      const user: AuthUser = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: userData?.name || userCredential.user.displayName || undefined,
        role: userData?.role || "user",
      }

      this.currentUser = user
      console.log("[UnifiedAuth] ✅ Sign in successful:", user.email)

      return {
        success: true,
        user,
        message: "Sign in successful",
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
   * Sign up with email and password
   */
  static async signUp(email: string, password: string, name?: string): Promise<AuthResult> {
    try {
      console.log("[UnifiedAuth] 📝 Creating new user:", email)

      if (!email || !password) {
        return {
          success: false,
          error: createError(
            ErrorType.API_MISSING_PARAMS,
            null,
            { function: "signUp" },
            "Email and password are required",
          ),
        }
      }

      const [userCredential, signUpError] = await tryCatch(
        () => createUserWithEmailAndPassword(auth, email, password),
        ErrorType.AUTH_EMAIL_ALREADY_EXISTS,
        { function: "signUp", email },
      )

      if (signUpError || !userCredential) {
        return { success: false, error: signUpError }
      }

      // Create user document in Firestore
      const userData = {
        email: userCredential.user.email,
        name: name || "",
        role: "user",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await this.createUserDocument(userCredential.user.uid, userData)

      const user: AuthUser = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: name,
        role: "user",
      }

      this.currentUser = user
      console.log("[UnifiedAuth] ✅ Sign up successful:", user.email)

      return {
        success: true,
        user,
        message: "Account created successfully",
      }
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

  /**
   * Sign out current user
   */
  static async signOut(): Promise<AuthResult> {
    try {
      console.log("[UnifiedAuth] 🚪 Signing out user")

      const [, signOutError] = await tryCatch(() => firebaseSignOut(auth), ErrorType.AUTH_SIGNOUT_FAILED, {
        function: "signOut",
      })

      if (signOutError) {
        return { success: false, error: signOutError }
      }

      this.currentUser = null
      console.log("[UnifiedAuth] ✅ Sign out successful")

      return {
        success: true,
        message: "Signed out successfully",
      }
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
   * Subscribe to auth state changes
   */
  static onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    this.authStateListeners.push(callback)

    // Call immediately with current state
    callback(this.currentUser)

    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback)
      if (index > -1) {
        this.authStateListeners.splice(index, 1)
      }
    }
  }

  // Private helper methods

  private static async getUserData(uid: string): Promise<any> {
    try {
      const userRef = doc(db, "users", uid)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        return userDoc.data()
      }

      return null
    } catch (error) {
      console.error("[UnifiedAuth] Error getting user data:", error)
      return null
    }
  }

  private static async createUserDocument(uid: string, userData: any): Promise<void> {
    try {
      const userRef = doc(db, "users", uid)
      await setDoc(userRef, userData)
      console.log("[UnifiedAuth] User document created:", uid)
    } catch (error) {
      console.error("[UnifiedAuth] Error creating user document:", error)
      throw error
    }
  }
}

// Initialize the service
if (typeof window !== "undefined") {
  UnifiedAuthService.initialize()
}
