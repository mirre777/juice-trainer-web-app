import { db } from "@/lib/firebase/firebase"
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where } from "firebase/firestore"
import type { AppError } from "@/lib/utils/error-handler"

export type WorkoutReaction = {
  userId: string
  workoutId: string
  reactionType: "like" | "love" | "celebrate" | "insightful" | "curious"
  createdAt: Date
}

const WORKOUT_REACTIONS_COLLECTION = "workoutReactions"

export const getWorkoutReaction = async (userId: string, workoutId: string): Promise<WorkoutReaction | null> => {
  try {
    const reactionDocRef = doc(db, WORKOUT_REACTIONS_COLLECTION, `${userId}_${workoutId}`)
    const reactionDocSnap = await getDoc(reactionDocRef)

    if (reactionDocSnap.exists()) {
      const reactionData = reactionDocSnap.data() as Omit<WorkoutReaction, "createdAt">
      return {
        ...reactionData,
        createdAt: reactionData.createdAt.toDate(),
      } as WorkoutReaction
    } else {
      return null
    }
  } catch (error: any) {
    console.error("Error getting workout reaction:", error)
    throw {
      status: "error",
      message: `Failed to get workout reaction: ${error.message}`,
      error,
    } as AppError
  }
}

export const createWorkoutReaction = async (workoutReaction: WorkoutReaction): Promise<void> => {
  try {
    const reactionDocRef = doc(
      db,
      WORKOUT_REACTIONS_COLLECTION,
      `${workoutReaction.userId}_${workoutReaction.workoutId}`,
    )

    await setDoc(reactionDocRef, workoutReaction)
  } catch (error: any) {
    console.error("Error creating workout reaction:", error)
    throw {
      status: "error",
      message: `Failed to create workout reaction: ${error.message}`,
      error,
    } as AppError
  }
}

export const updateWorkoutReaction = async (
  userId: string,
  workoutId: string,
  reactionType: WorkoutReaction["reactionType"],
): Promise<void> => {
  try {
    const reactionDocRef = doc(db, WORKOUT_REACTIONS_COLLECTION, `${userId}_${workoutId}`)

    await updateDoc(reactionDocRef, { reactionType })
  } catch (error: any) {
    console.error("Error updating workout reaction:", error)
    throw {
      status: "error",
      message: `Failed to update workout reaction: ${error.message}`,
      error,
    } as AppError
  }
}

export const deleteWorkoutReaction = async (userId: string, workoutId: string): Promise<void> => {
  try {
    const reactionDocRef = doc(db, WORKOUT_REACTIONS_COLLECTION, `${userId}_${workoutId}`)

    await deleteDoc(reactionDocRef)
  } catch (error: any) {
    console.error("Error deleting workout reaction:", error)
    throw {
      status: "error",
      message: `Failed to delete workout reaction: ${error.message}`,
      error,
    } as AppError
  }
}

export const getWorkoutReactionsByWorkoutId = async (workoutId: string): Promise<WorkoutReaction[]> => {
  try {
    const reactionsCollectionRef = collection(db, WORKOUT_REACTIONS_COLLECTION)
    const q = query(reactionsCollectionRef, where("workoutId", "==", workoutId))
    const querySnapshot = await getDocs(q)

    const reactions: WorkoutReaction[] = []
    querySnapshot.forEach((doc) => {
      const reactionData = doc.data() as Omit<WorkoutReaction, "createdAt">
      reactions.push({
        ...reactionData,
        createdAt: reactionData.createdAt.toDate(),
      } as WorkoutReaction)
    })

    return reactions
  } catch (error: any) {
    console.error("Error getting workout reactions by workoutId:", error)
    throw {
      status: "error",
      message: `Failed to get workout reactions by workoutId: ${error.message}`,
      error,
    } as AppError
  }
}
