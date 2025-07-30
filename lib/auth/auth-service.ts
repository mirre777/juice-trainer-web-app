// Authentication service for handling login, signup, and session management

import { db } from "@/lib/firebase/firebase"
import { doc, getDoc } from "firebase/firestore"
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth"
import { cookies } from "next/headers"

// Sign in with email and password
export async function signIn(email: string, password: string) {
  try {
    if (!email || !password) {
      return { success: false, error: "Email and password are required" }
    }

    const auth = getAuth()
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    const token = await user.getIdToken()

    const cookieStore = await cookies()
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    return { success: true, user }
  } catch (error: any) {
    console.error("Sign in error:", error)
    return { success: false, error: error.message }
  }
}

// Sign up with email and password
export async function signUp(email: string, password: string) {
  try {
    if (!email || !password) {
      return { success: false, error: "Email, password, and user data are required" }
    }

    const auth = getAuth()
    console.log("Creating user with email:", email, "and password:", password)
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    const token = await user.getIdToken()

    const cookieStore = await cookies()
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    return { success: true, user }
  } catch (error: any) {
    console.error("Sign up error:", error)
    return { success: false, error: error.message }
  }
}

// Sign out
export async function signOut() {
  try {
    const auth = getAuth()
    await firebaseSignOut(auth)

    const cookieStore = await cookies()
    cookieStore.delete("auth_token")

    return { success: true }
  } catch (error: any) {
    console.error("Sign out error:", error)
    return { success: false, error: error.message }
  }
}

// Get current user
export async function getCurrentUser() {
  try {
    const auth = getAuth()
    const user = auth.currentUser

    if (!user) {
      return { success: false, error: "No user is signed in" }
    }

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid))

    if (!userDoc.exists()) {
      return { success: false, error: "User document not found" }
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
    console.error("Get current user error:", error)
    return { success: false, error: error.message }
  }
}
