import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth"
import { auth } from "@/lib/firebase/firebase"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  role?: string
}

// Sign in with email and password
export const signIn = async (email: string, password: string): Promise<AuthUser> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Get the ID token
    const idToken = await user.getIdToken()

    // Store the token in a cookie via API call
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    })

    if (!response.ok) {
      throw new Error("Failed to set authentication cookie")
    }

    // Get user role from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid))
    const userData = userDoc.data()

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: userData?.role || "client",
    }
  } catch (error) {
    console.error("Sign in error:", error)
    throw error
  }
}

// Sign up with email and password
export const signUp = async (email: string, password: string, displayName: string): Promise<AuthUser> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Create user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      displayName,
      role: "trainer", // Default role
      createdAt: new Date().toISOString(),
      approved: false, // Requires approval
    })

    // Get the ID token
    const idToken = await user.getIdToken()

    // Store the token in a cookie via API call
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    })

    if (!response.ok) {
      throw new Error("Failed to set authentication cookie")
    }

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: "trainer",
    }
  } catch (error) {
    console.error("Sign up error:", error)
    throw error
  }
}

// Sign out
export const signOut = async (): Promise<void> => {
  try {
    // Clear the authentication cookie
    await fetch("/api/auth/logout", {
      method: "POST",
    })

    // Sign out from Firebase
    await firebaseSignOut(auth)
  } catch (error) {
    console.error("Sign out error:", error)
    throw error
  }
}

// Get current user
export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const response = await fetch("/api/auth/me")
    return response.ok
  } catch (error) {
    return false
  }
}
