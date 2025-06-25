import { auth, db, getDoc } from "@/lib/firebase/firebase"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth"
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  addDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore"
import type { AppError } from "@/lib/utils/error-handler"

interface UserProfile {
  displayName: string | null
  photoURL: string | null
}

// Simplified user creation - no complex role logic
export async function createUser(userData: {
  email: string
  password?: string
  name?: string
  inviteCode?: string
}): Promise<{ success: boolean; userId?: string; error?: any }> {
  try {
    let userId: string

    // Create Firebase Auth user if password provided
    if (userData.password) {
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password) // Use client-side auth
      userId = userCredential.user.uid
    } else {
      // Create Firestore-only user
      const usersRef = collection(db, "users") // Use client-side db
      const docRef = await addDoc(usersRef, { email: userData.email.toLowerCase() })
      userId = docRef.id
    }

    // Simple user document - no complex fields
    const userDocData: any = {
      email: userData.email.toLowerCase(),
      name: userData.name || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    // If they used an invite code, add them to trainer's pending list
    if (userData.inviteCode) {
      const trainer = await getTrainerByInviteCode(userData.inviteCode)
      if (trainer) {
        userDocData.pendingApprovalFrom = trainer.id
        userDocData.status = "pending_approval"

        // Add to trainer's pending list
        const trainerRef = doc(db, "users", trainer.id) // Use client-side db
        await updateDoc(trainerRef, {
          pendingUsers: arrayUnion(userId),
        })
      }
    }

    const userRef = doc(db, "users", userId) // Use client-side db
    await setDoc(userRef, userDocData)

    return { success: true, userId }
  } catch (error) {
    console.error("Error creating user:", error)
    return { success: false, error }
  }
}

// Find trainer by their universal invite code
async function getTrainerByInviteCode(inviteCode: string) {
  const usersRef = collection(db, "users") // Use client-side db
  const q = query(usersRef, where("universalInviteCode", "==", inviteCode.toUpperCase()))
  const querySnapshot = await getDocs(q)

  if (!querySnapshot.empty) {
    const trainerDoc = querySnapshot.docs[0]
    return { id: trainerDoc.id, ...trainerDoc.data() }
  }
  return null
}

// Simplified approval - just move user from pending to approved
export async function approveUser(
  trainerId: string,
  userId: string,
  action: "approve" | "reject",
): Promise<{ success: boolean; error?: any }> {
  try {
    const userRef = doc(db, "users", userId) // Use client-side db
    const trainerRef = doc(db, "users", trainerId) // Use client-side db

    if (action === "approve") {
      // Update user status
      await updateDoc(userRef, {
        status: "approved",
        trainerId: trainerId, // Simple - just store the trainer ID
        approvedAt: serverTimestamp(),
      })
    } else {
      // Reject user
      await updateDoc(userRef, {
        status: "rejected",
        rejectedAt: serverTimestamp(),
      })
    }

    // Remove from pending list
    await updateDoc(trainerRef, {
      pendingUsers: arrayRemove(userId),
    })

    return { success: true }
  } catch (error) {
    console.error("Error approving user:", error)
    return { success: false, error }
  }
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
