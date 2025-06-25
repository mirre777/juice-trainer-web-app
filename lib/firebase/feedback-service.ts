import { db } from "@/lib/firebase/firebase"
import { addDoc, collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore"
import type { AppError } from "@/lib/utils/error-handler"

export interface Feedback {
  id?: string
  userId: string
  route: string
  rating: number
  comment: string
  createdAt: string
  status: "pending" | "approved" | "rejected"
}

const feedbackCollection = collection(db, "feedback")

export const addFeedback = async (
  userId: string,
  route: string,
  rating: number,
  comment: string,
): Promise<Feedback | AppError> => {
  try {
    const createdAt = new Date().toISOString()
    const docRef = await addDoc(feedbackCollection, {
      userId,
      route,
      rating,
      comment,
      createdAt,
      status: "pending",
    })

    const newFeedback: Feedback = {
      id: docRef.id,
      userId,
      route,
      rating,
      comment,
      createdAt,
      status: "pending",
    }

    return newFeedback
  } catch (error: any) {
    return {
      message: error.message || "Failed to add feedback",
      status: "error",
    }
  }
}

export const getFeedbackByRoute = async (route: string): Promise<Feedback[]> => {
  try {
    const q = query(feedbackCollection, where("route", "==", route))
    const querySnapshot = await getDocs(q)
    const feedback: Feedback[] = []
    querySnapshot.forEach((doc) => {
      feedback.push({ id: doc.id, ...doc.data() } as Feedback)
    })
    return feedback
  } catch (error) {
    console.error("Error getting feedback by route:", error)
    return []
  }
}

export const getAllFeedback = async (): Promise<Feedback[]> => {
  try {
    const querySnapshot = await getDocs(feedbackCollection)
    const feedback: Feedback[] = []
    querySnapshot.forEach((doc) => {
      feedback.push({ id: doc.id, ...doc.data() } as Feedback)
    })
    return feedback
  } catch (error) {
    console.error("Error getting all feedback:", error)
    return []
  }
}

export const updateFeedbackStatus = async (
  feedbackId: string,
  status: "pending" | "approved" | "rejected",
): Promise<void> => {
  try {
    const feedbackDoc = doc(db, "feedback", feedbackId)
    await updateDoc(feedbackDoc, {
      status: status,
    })
  } catch (error) {
    console.error("Error updating feedback status:", error)
    throw error
  }
}
