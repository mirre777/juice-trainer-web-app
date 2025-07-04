// Authentication service for handling login, signup, and session management

import { db } from "@/lib/firebase/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth"
import { cookies } from "next/headers"
import { ErrorType, createError, logError, tryCatch } from "@/lib/utils/error-handler"

// Sign in with email and password
export async function signIn(email: string, password: string) {
  try {
    // Validate input
    if (!email || !password) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "signIn" },
        "Email and password are required",
      )
      logError(error)
      return { success: false, error }
    }

    const auth = getAuth()
    const [userCredential, authError] = await tryCatch(
      () => signInWithEmailAndPassword(auth, email, password),
      ErrorType.AUTH_INVALID_CREDENTIALS,
      { function: "signIn", email },
    )

    if (authError || !userCredential) {
      return { success: false, error: authError }
    }

    const user = userCredential.user

    // Set auth cookie
    const [token, tokenError] = await tryCatch(() => user.getIdToken(), ErrorType.AUTH_TOKEN_EXPIRED, {
      function: "signIn",
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
      { function: "signIn", email },
      "Unexpected error during sign in",
    )
    logError(appError)
    return { success: false, error: appError }
  }
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
  try {
    const auth = getAuth()
    const [, authError] = await tryCatch(() => firebaseSignOut(auth), ErrorType.AUTH_UNAUTHORIZED, {
      function: "signOut",
    })

    if (authError) {
      // Log but continue with cookie removal
      logError(authError)
    }

    // Remove auth cookie - update this to be more explicit
    cookies().delete("auth_token", {
      path: "/",
      // Make sure we're using the same cookie settings as when we set it
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    })

    return { success: true }
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

// Get current user
export async function getCurrentUser() {
  try {
    const auth = getAuth()
    const user = auth.currentUser

    if (!user) {
      const error = createError(
        ErrorType.AUTH_UNAUTHORIZED,
        null,
        { function: "getCurrentUser" },
        "No user is signed in",
      )
      return { success: false, error }
    }

    // Get user data from Firestore
    const [userDoc, docError] = await tryCatch(() => getDoc(doc(db, "users", user.uid)), ErrorType.DB_READ_FAILED, {
      function: "getCurrentUser",
      uid: user.uid,
    })

    if (docError || !userDoc) {
      return { success: false, error: docError }
    }

    if (!userDoc.exists()) {
      const error = createError(
        ErrorType.DB_DOCUMENT_NOT_FOUND,
        null,
        { function: "getCurrentUser", uid: user.uid },
        "User document not found",
      )
      return { success: false, error }
    }

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        ...userDoc.data(),
      },
    }
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
