import { initializeApp } from "firebase/app"
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  updateEmail,
  deleteUser,
} from "firebase/auth"
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { firebaseConfig } from "./config"
import { createError, ErrorType } from "@/lib/utils/error-handler"

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

// User Service Class
class UserService {
  // Authentication methods
  async signUp(email: string, password: string, displayName: string): Promise<void> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Update user profile with display name
      await updateProfile(user, { displayName })

      // Create user document in Firestore
      await this.createUserDocument(user.uid, {
        email: user.email,
        displayName: displayName,
        createdAt: new Date(),
      })
    } catch (error: any) {
      throw createError(ErrorType.FirebaseSignUpError, error.message)
    }
  }

  async signIn(email: string, password: string): Promise<void> {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      throw createError(ErrorType.FirebaseSignInError, error.message)
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(auth)
    } catch (error: any) {
      throw createError(ErrorType.FirebaseSignOutError, error.message)
    }
  }

  // User data management methods
  async createUserDocument(userId: string, data: any): Promise<void> {
    try {
      const userDocRef = doc(db, "users", userId)
      await setDoc(userDocRef, data)
    } catch (error: any) {
      throw createError(ErrorType.FirebaseCreateDocumentError, error.message)
    }
  }

  async getUserDocument(userId: string): Promise<any> {
    try {
      const userDocRef = doc(db, "users", userId)
      const docSnap = await getDoc(userDocRef)

      if (docSnap.exists()) {
        return docSnap.data()
      } else {
        return null // Or throw an error if you prefer
      }
    } catch (error: any) {
      throw createError(ErrorType.FirebaseGetDocumentError, error.message)
    }
  }

  async updateUserDocument(userId: string, data: any): Promise<void> {
    try {
      const userDocRef = doc(db, "users", userId)
      await updateDoc(userDocRef, data)
    } catch (error: any) {
      throw createError(ErrorType.FirebaseUpdateDocumentError, error.message)
    }
  }

  async deleteUserDocument(userId: string): Promise<void> {
    try {
      const userDocRef = doc(db, "users", userId)
      await deleteDoc(userDocRef)
    } catch (error: any) {
      throw createError(ErrorType.FirebaseDeleteDocumentError, error.message)
    }
  }

  async updateProfile(displayName: string): Promise<void> {
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName })
        await this.updateUserDocument(auth.currentUser.uid, { displayName })
      } else {
        throw createError(ErrorType.AuthenticationError, "No user currently logged in.")
      }
    } catch (error: any) {
      throw createError(ErrorType.FirebaseUpdateProfileError, error.message)
    }
  }

  async updateEmail(email: string): Promise<void> {
    try {
      if (auth.currentUser) {
        await updateEmail(auth.currentUser, email)
        await this.updateUserDocument(auth.currentUser.uid, { email })
      } else {
        throw createError(ErrorType.AuthenticationError, "No user currently logged in.")
      }
    } catch (error: any) {
      throw createError(ErrorType.FirebaseUpdateEmailError, error.message)
    }
  }

  async deleteUser(): Promise<void> {
    try {
      if (auth.currentUser) {
        const userId = auth.currentUser.uid
        await deleteUser(auth.currentUser)
        await this.deleteUserDocument(userId)
      } else {
        throw createError(ErrorType.AuthenticationError, "No user currently logged in.")
      }
    } catch (error: any) {
      throw createError(ErrorType.FirebaseDeleteUserError, error.message)
    }
  }

  // Storage methods (example for profile pictures)
  async uploadProfilePicture(userId: string, file: File): Promise<string> {
    try {
      const storageRef = ref(storage, `profile-pictures/${userId}/${file.name}`)
      await uploadBytes(storageRef, file)
      return await getDownloadURL(storageRef)
    } catch (error: any) {
      throw createError(ErrorType.FirebaseStorageUploadError, error.message)
    }
  }

  async getProfilePictureURL(userId: string, imageName: string): Promise<string | null> {
    try {
      const storageRef = ref(storage, `profile-pictures/${userId}/${imageName}`)
      return await getDownloadURL(storageRef)
    } catch (error: any) {
      // Handle the case where the image doesn't exist gracefully
      if (error.code === "storage/object-not-found") {
        return null
      }
      throw createError(ErrorType.FirebaseStorageGetError, error.message)
    }
  }

  async deleteProfilePicture(userId: string, imageName: string): Promise<void> {
    try {
      const storageRef = ref(storage, `profile-pictures/${userId}/${imageName}`)
      await deleteObject(storageRef)
    } catch (error: any) {
      throw createError(ErrorType.FirebaseStorageDeleteError, error.message)
    }
  }
}

export const userService = new UserService()
