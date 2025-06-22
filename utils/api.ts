import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore"
import { db } from "../lib/firebase/firebase"

const handleApiError = (functionName: string, error: any) => {
  console.error(`API Error in ${functionName}:`, error)
  console.error(`Error details:`, {
    message: error.message,
    code: error.code,
    stack: error.stack,
  })
  throw error
}

// Export all the required functions
export const fetchClientData = async (clientId: string) => {
  try {
    const clientDoc = await getDoc(doc(db, "clients", clientId))
    return clientDoc.exists() ? { id: clientDoc.id, ...clientDoc.data() } : null
  } catch (error) {
    console.error("Error fetching client data:", error)
    return null
  }
}

export const fetchWorkoutData = async (userId: string, workoutId: string) => {
  try {
    console.log(`[API] fetchWorkoutData called with userId: ${userId}, workoutId: ${workoutId}`)

    if (!userId || !workoutId) {
      console.error("[API] fetchWorkoutData: userId or workoutId is undefined or empty")
      return null
    }

    const workoutDoc = await getDoc(doc(db, `users/${userId}/workouts`, workoutId))
    return workoutDoc.exists() ? { id: workoutDoc.id, ...workoutDoc.data() } : null
  } catch (error) {
    handleApiError("fetchWorkoutData", error)
    return null
  }
}

export const fetchExerciseData = async (exerciseId: string) => {
  try {
    const exerciseDoc = await getDoc(doc(db, "exercises", exerciseId))
    return exerciseDoc.exists() ? { id: exerciseDoc.id, ...exerciseDoc.data() } : null
  } catch (error) {
    console.error("Error fetching exercise data:", error)
    return null
  }
}

export const fetchPersonalRecords = async (userId: string) => {
  try {
    const prDoc = await getDoc(doc(db, `users/${userId}/stats`, "personal-records"))
    return prDoc.exists() ? prDoc.data() : {}
  } catch (error) {
    console.error("Error fetching personal records:", error)
    return {}
  }
}

export const fetchAllWorkoutsForClient = async (userId: string) => {
  try {
    const workoutsRef = collection(db, `users/${userId}/workouts`)
    const workoutsSnapshot = await getDocs(workoutsRef)
    return workoutsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error("Error fetching all workouts:", error)
    return []
  }
}

export const fetchWeeklyWorkouts = async (userId: string, startDate: Date, endDate: Date) => {
  try {
    const workoutsRef = collection(db, `users/${userId}/workouts`)
    const q = query(workoutsRef, where("completedAt", ">=", startDate), where("completedAt", "<=", endDate))
    const workoutsSnapshot = await getDocs(q)
    return workoutsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error("Error fetching weekly workouts:", error)
    return []
  }
}
