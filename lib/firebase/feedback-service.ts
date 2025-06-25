import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getAnalytics } from "firebase/analytics"
import { createError, ErrorType } from "@/lib/utils/error-handler"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)
let analytics

if (typeof window !== "undefined") {
  analytics = getAnalytics(app)
}

interface FeedbackData {
  message: string
  rating: number
}

async function submitFeedback(feedbackData: FeedbackData): Promise<string> {
  try {
    const feedbackCollection = collection(db, "feedback")
    const docRef = await addDoc(feedbackCollection, {
      ...feedbackData,
      createdAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error: any) {
    console.error("Error adding feedback:", error)
    throw createError(ErrorType.FirebaseError, "Failed to submit feedback: " + error.message)
  }
}

async function getLatestFeedback(limitCount = 5) {
  try {
    const feedbackCollection = collection(db, "feedback")
    const q = query(feedbackCollection, orderBy("createdAt", "desc"), limit(limitCount))
    const querySnapshot = await getDocs(q)
    const feedback: any[] = []
    querySnapshot.forEach((doc) => {
      feedback.push({ id: doc.id, ...doc.data() })
    })
    return feedback
  } catch (error: any) {
    console.error("Error getting feedback:", error)
    throw createError(ErrorType.FirebaseError, "Failed to retrieve feedback: " + error.message)
  }
}

export { auth, db, analytics, submitFeedback, getLatestFeedback }
export type { FeedbackData }
