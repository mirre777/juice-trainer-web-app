import { auth, db } from "@/lib/firebase/firebase"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import type { AppError } from "@/lib/utils/error-handler"

interface UserProfile {
  displayName: string | null
  photoURL: string | null
}

export const signUp = async (email: string, password: string, profile: UserProfile): Promise<void | AppError> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    await updateProfile(user, {
      displayName: profile.displayName,
      photoURL: profile.photoURL,
    })

    // Store additional user data in Firestore
    const userDocRef = doc(db, "users", user.uid)
    await setDoc(userDocRef, {
      email: user.email,
      displayName: profile.displayName,
      photoURL: profile.photoURL,
      // Add any other relevant user data here
    })

    console.log("Sign up successful!")
  } catch (error: any) {
    console.error("Error signing up:", error)
    throw {
      message: error.message,
      code: error.code,
    }
  }
}

export const signIn = async (email: string, password: string): Promise<void | AppError> => {
  try {
    await signInWithEmailAndPassword(auth, email, password)
    console.log("Sign in successful!")
  } catch (error: any) {
    console.error("Error signing in:", error)
    throw {
      message: error.message,
      code: error.code,
    }
  }
}

export const signOutUser = async (): Promise<void | AppError> => {
  try {
    await signOut(auth)
    console.log("Sign out successful!")
  } catch (error: any) {
    console.error("Error signing out:", error)
    throw {
      message: error.message,
      code: error.code,
    }
  }
}

export const getUserData = async (userId: string): Promise<any | null> => {
  try {
    const userDocRef = doc(db, "users", userId)
    const docSnap = await getDoc(userDocRef)

    if (docSnap.exists()) {
      return docSnap.data()
    } else {
      console.log("No such document!")
      return null
    }
  } catch (error) {
    console.error("Error fetching user data:", error)
    return null
  }
}
