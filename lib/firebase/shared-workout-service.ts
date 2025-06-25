import { db } from "@/lib/firebase/firebase"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore"
import type { SharedWorkout } from "@/types"
import { v4 as uuidv4 } from "uuid"
import type { AppError } from "@/lib/utils/error-handler"

const SHARED_WORKOUTS_COLLECTION = "sharedWorkouts"

export const createSharedWorkout = async (
  workout: Omit<SharedWorkout, "id" | "createdAt" | "updatedAt" | "sharedWith">,
  userId: string,
): Promise<SharedWorkout> => {
  try {
    const id = uuidv4()
    const createdAt = new Date()
    const updatedAt = new Date()
    const sharedWorkout: SharedWorkout = {
      ...workout,
      id,
      createdAt,
      updatedAt,
      sharedWith: [],
    }

    const docRef = doc(db, SHARED_WORKOUTS_COLLECTION, id)
    await setDoc(docRef, sharedWorkout)

    return sharedWorkout
  } catch (error: any) {
    throw {
      status: 500,
      message: `Failed to create shared workout: ${error.message}`,
    } as AppError
  }
}

export const getSharedWorkout = async (id: string): Promise<SharedWorkout | null> => {
  try {
    const docRef = doc(db, SHARED_WORKOUTS_COLLECTION, id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data() as SharedWorkout
    } else {
      return null
    }
  } catch (error: any) {
    throw {
      status: 500,
      message: `Failed to get shared workout: ${error.message}`,
    } as AppError
  }
}

export const getSharedWorkoutsByUserId = async (userId: string): Promise<SharedWorkout[]> => {
  try {
    const q = query(collection(db, SHARED_WORKOUTS_COLLECTION), where("ownerId", "==", userId))
    const querySnapshot = await getDocs(q)
    const sharedWorkouts: SharedWorkout[] = []
    querySnapshot.forEach((doc) => {
      sharedWorkouts.push(doc.data() as SharedWorkout)
    })
    return sharedWorkouts
  } catch (error: any) {
    throw {
      status: 500,
      message: `Failed to get shared workouts for user: ${error.message}`,
    } as AppError
  }
}

export const updateSharedWorkout = async (
  id: string,
  updates: Partial<Omit<SharedWorkout, "id" | "createdAt" | "sharedWith">>,
): Promise<void> => {
  try {
    const docRef = doc(db, SHARED_WORKOUTS_COLLECTION, id)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date(),
    })
  } catch (error: any) {
    throw {
      status: 500,
      message: `Failed to update shared workout: ${error.message}`,
    } as AppError
  }
}

export const shareWorkoutWithUser = async (workoutId: string, userIdToShare: string): Promise<void> => {
  try {
    const docRef = doc(db, SHARED_WORKOUTS_COLLECTION, workoutId)
    await updateDoc(docRef, {
      sharedWith: arrayUnion(userIdToShare),
    })
  } catch (error: any) {
    throw {
      status: 500,
      message: `Failed to share workout: ${error.message}`,
    } as AppError
  }
}

export const unshareWorkoutWithUser = async (workoutId: string, userIdToUnshare: string): Promise<void> => {
  try {
    const docRef = doc(db, SHARED_WORKOUTS_COLLECTION, workoutId)
    await updateDoc(docRef, {
      sharedWith: arrayRemove(userIdToUnshare),
    })
  } catch (error: any) {
    throw {
      status: 500,
      message: `Failed to unshare workout: ${error.message}`,
    } as AppError
  }
}

export const getSharedWorkoutsSharedWithUser = async (userId: string): Promise<SharedWorkout[]> => {
  try {
    const q = query(collection(db, SHARED_WORKOUTS_COLLECTION), where("sharedWith", "array-contains", userId))
    const querySnapshot = await getDocs(q)
    const sharedWorkouts: SharedWorkout[] = []
    querySnapshot.forEach((doc) => {
      sharedWorkouts.push(doc.data() as SharedWorkout)
    })
    return sharedWorkouts
  } catch (error: any) {
    throw {
      status: 500,
      message: `Failed to get shared workouts shared with user: ${error.message}`,
    } as AppError
  }
}
