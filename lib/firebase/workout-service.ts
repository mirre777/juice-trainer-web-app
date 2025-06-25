import { db } from "@/lib/firebase/firebase"
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore"
import type { Workout } from "@/types"
import type { AppError } from "@/lib/utils/error-handler"

const WORKOUTS_COLLECTION = "workouts"

export const createWorkout = async (
  userId: string,
  workoutData: Omit<Workout, "id" | "createdAt" | "updatedAt">,
): Promise<Workout> => {
  try {
    const workoutsCollection = collection(db, WORKOUTS_COLLECTION)
    const workoutDocRef = doc(workoutsCollection) // Generates a unique ID
    const now = new Date()

    const workout: Workout = {
      id: workoutDocRef.id,
      userId,
      ...workoutData,
      createdAt: now,
      updatedAt: now,
    }

    await setDoc(workoutDocRef, workout)
    return workout
  } catch (error: any) {
    console.error("Error creating workout:", error)
    throw {
      status: 500,
      message: "Failed to create workout",
      error: error.message,
    } as AppError
  }
}

export const getWorkout = async (workoutId: string): Promise<Workout | null> => {
  try {
    const workoutDocRef = doc(db, WORKOUTS_COLLECTION, workoutId)
    const workoutDoc = await getDoc(workoutDocRef)

    if (workoutDoc.exists()) {
      return workoutDoc.data() as Workout
    } else {
      return null
    }
  } catch (error: any) {
    console.error("Error getting workout:", error)
    throw {
      status: 500,
      message: "Failed to get workout",
      error: error.message,
    } as AppError
  }
}

export const updateWorkout = async (
  workoutId: string,
  workoutData: Partial<Omit<Workout, "id" | "userId" | "createdAt">>,
): Promise<Workout> => {
  try {
    const workoutDocRef = doc(db, WORKOUTS_COLLECTION, workoutId)
    const workoutDoc = await getDoc(workoutDocRef)

    if (!workoutDoc.exists()) {
      throw {
        status: 404,
        message: "Workout not found",
      } as AppError
    }

    const now = new Date()
    await updateDoc(workoutDocRef, { ...workoutData, updatedAt: now })

    // Fetch the updated document to return
    const updatedWorkoutDoc = await getDoc(workoutDocRef)
    return updatedWorkoutDoc.data() as Workout
  } catch (error: any) {
    console.error("Error updating workout:", error)
    throw {
      status: error.status || 500,
      message: error.message || "Failed to update workout",
      error: error.error,
    } as AppError
  }
}

export const deleteWorkout = async (workoutId: string): Promise<void> => {
  try {
    const workoutDocRef = doc(db, WORKOUTS_COLLECTION, workoutId)
    await deleteDoc(workoutDocRef)
  } catch (error: any) {
    console.error("Error deleting workout:", error)
    throw {
      status: 500,
      message: "Failed to delete workout",
      error: error.message,
    } as AppError
  }
}

export const listWorkoutsByUser = async (
  userId: string,
  pageSize: number,
  cursor?: string,
): Promise<{ workouts: Workout[]; nextCursor?: string }> => {
  try {
    const workoutsCollection = collection(db, WORKOUTS_COLLECTION)

    let q
    if (cursor) {
      const cursorDoc = await getDoc(doc(db, WORKOUTS_COLLECTION, cursor))
      if (!cursorDoc.exists()) {
        return { workouts: [], nextCursor: undefined }
      }
      q = query(
        workoutsCollection,
        where("userId", "==", userId),
        orderBy("createdAt"),
        startAfter(cursorDoc),
        limit(pageSize),
      )
    } else {
      q = query(workoutsCollection, where("userId", "==", userId), orderBy("createdAt"), limit(pageSize))
    }

    const querySnapshot = await getDocs(q)
    const workouts: Workout[] = []
    querySnapshot.forEach((doc) => {
      workouts.push(doc.data() as Workout)
    })

    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1]
    const nextCursor = lastVisible ? lastVisible.id : undefined

    return { workouts, nextCursor }
  } catch (error: any) {
    console.error("Error listing workouts:", error)
    throw {
      status: 500,
      message: "Failed to list workouts",
      error: error.message,
    } as AppError
  }
}
