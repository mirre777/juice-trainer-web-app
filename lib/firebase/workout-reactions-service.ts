import { type AppError, createError, ErrorType } from "@/lib/utils/error-handler"

import { db } from "@/lib/firebase/firebase"
import {
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore"

export type WorkoutReaction = {
  workoutId: string
  userId: string
  reaction: "like" | "dislike"
  createdAt: Date
  updatedAt: Date
}

const workoutReactionsConverter: FirestoreDataConverter<WorkoutReaction> = {
  toFirestore: (reaction: WorkoutReaction): DocumentData => {
    return {
      workoutId: reaction.workoutId,
      userId: reaction.userId,
      reaction: reaction.reaction,
      createdAt: reaction.createdAt,
      updatedAt: reaction.updatedAt,
    }
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions): WorkoutReaction => {
    const data = snapshot.data(options)
    return {
      workoutId: data.workoutId,
      userId: data.userId,
      reaction: data.reaction,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    }
  },
}

const workoutReactionsCollection = collection(db, "workoutReactions").withConverter(workoutReactionsConverter)

export const getWorkoutReaction = async (
  workoutId: string,
  userId: string,
): Promise<WorkoutReaction | AppError | null> => {
  try {
    const workoutReactionDoc = doc(workoutReactionsCollection, `${workoutId}-${userId}`)
    const workoutReactionSnap = await getDoc(workoutReactionDoc)

    if (!workoutReactionSnap.exists()) {
      return null
    }

    return workoutReactionSnap.data()
  } catch (error: any) {
    return createError(ErrorType.GetWorkoutReactionError, error.message)
  }
}

export const createWorkoutReaction = async (workoutReaction: WorkoutReaction): Promise<WorkoutReaction | AppError> => {
  try {
    const workoutReactionDoc = doc(workoutReactionsCollection, `${workoutReaction.workoutId}-${workoutReaction.userId}`)

    await setDoc(workoutReactionDoc, workoutReaction)

    return workoutReaction
  } catch (error: any) {
    return createError(ErrorType.CreateWorkoutReactionError, error.message)
  }
}

export const updateWorkoutReaction = async (
  workoutId: string,
  userId: string,
  reaction: "like" | "dislike",
): Promise<WorkoutReaction | AppError> => {
  try {
    const workoutReactionDoc = doc(workoutReactionsCollection, `${workoutId}-${userId}`)

    const workoutReaction = await getWorkoutReaction(workoutId, userId)

    if (!workoutReaction) {
      return createError(ErrorType.UpdateWorkoutReactionError, "Workout reaction not found")
    }

    if ((workoutReaction as AppError).message) {
      return workoutReaction as AppError
    }

    const updatedWorkoutReaction: WorkoutReaction = {
      workoutId: workoutId,
      userId: userId,
      reaction: reaction,
      createdAt: (workoutReaction as WorkoutReaction).createdAt,
      updatedAt: new Date(),
    }

    await updateDoc(workoutReactionDoc, {
      reaction: updatedWorkoutReaction.reaction,
      updatedAt: updatedWorkoutReaction.updatedAt,
    })

    return updatedWorkoutReaction
  } catch (error: any) {
    return createError(ErrorType.UpdateWorkoutReactionError, error.message)
  }
}
