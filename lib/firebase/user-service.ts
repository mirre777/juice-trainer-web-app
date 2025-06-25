import { auth, db } from "@/lib/firebase/firebase"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"

export const createUser = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
): Promise<void> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    await updateProfile(user, {
      displayName: `${firstName} ${lastName}`,
    })

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      firstName: firstName,
      lastName: lastName,
      displayName: `${firstName} ${lastName}`,
    })
  } catch (error: any) {
    throw { message: error.message, code: error.code }
  }
}

export const signInUser = async (email: string, password: string): Promise<void> => {
  try {
    await signInWithEmailAndPassword(auth, email, password)
  } catch (error: any) {
    throw { message: error.message, code: error.code }
  }
}

export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth)
  } catch (error: any) {
    throw { message: error.message, code: error.code }
  }
}

export const getUserData = async (userId: string): Promise<any> => {
  try {
    const userRef = doc(db, "users", userId)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      return userSnap.data()
    } else {
      return null
    }
  } catch (error: any) {
    throw { message: error.message, code: error.code }
  }
}
