import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import type { FirebaseWorkout } from "@/lib/firebase/workout-service"

// Helper function to format Firestore timestamp strings
function formatFirestoreDate(dateString: string | undefined): string {
  if (!dateString) return "N/A"

  try {
    // Check if the dateString is a Firestore timestamp object with seconds and nanoseconds
    if (typeof dateString === "object" && dateString !== null) {
      const timestamp = dateString as any
      if (timestamp.seconds && timestamp.nanoseconds) {
        // Convert Firestore timestamp to JavaScript Date
        const date = new Date(timestamp.seconds * 1000)
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      }
    }

    // Try to parse as a date string
    const date = new Date(dateString)
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    }

    return "Invalid date format"
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Error formatting date"
  }
}

export async function getSharedWorkout(
  userId: string,
  workoutId: string,
): Promise<{ workout: FirebaseWorkout | null; error: any }> {
  try {
    console.log(`[shared-workout-service] Fetching workout ${workoutId} for user ${userId}`)

    if (!userId || !workoutId) {
      return {
        workout: null,
        error: { message: "User ID and workout ID are required" },
      }
    }

    // Fetch the workout directly from the user's workouts collection
    const workoutRef = doc(db, `users/${userId}/workouts/${workoutId}`)
    const workoutDoc = await getDoc(workoutRef)

    if (!workoutDoc.exists()) {
      console.log(`[shared-workout-service] Workout not found: ${workoutId}`)
      return { workout: null, error: null }
    }

    const data = workoutDoc.data()
    console.log("[shared-workout-service] Raw workout data:", data)

    // Format the workout data
    const workout: FirebaseWorkout = {
      id: workoutDoc.id,
      name: data.name || "Workout",
      notes: data.notes || "",
      startedAt: data.startedAt || "N/A",
      completedAt: data.completedAt || null,
      createdAt: data.createdAt || "N/A",
      duration: data.duration || 0,
      status: data.status || "completed",
      exercises: data.exercises || [],

      // Derived fields for UI
      day: "N/A",
      focus: data.name || "Workout",
      clientName: data.clientName || "User",
      date: formatFirestoreDate(data.startedAt),
      progress: {
        completed: data.status === "completed" ? 1 : 0,
        total: 1,
      },
    }

    // Add personal records if any exercise has a significant weight
    if (data.exercises && data.exercises.length > 0) {
      const personalRecords = []

      for (const exercise of data.exercises) {
        if (exercise.sets && exercise.sets.length > 0) {
          // Find the set with the highest weight
          const maxWeightSet = exercise.sets.reduce(
            (prev: any, current: any) => (current.weight > prev.weight ? current : prev),
            exercise.sets[0],
          )

          if (maxWeightSet && maxWeightSet.weight > 0) {
            personalRecords.push({
              exercise: exercise.name,
              weight: `${maxWeightSet.weight} kg`,
              reps: maxWeightSet.reps,
              date: formatFirestoreDate(data.completedAt || data.startedAt),
              isPR: true,
            })
          }
        }
      }

      if (personalRecords.length > 0) {
        workout.personalRecords = personalRecords
      }
    }

    return { workout, error: null }
  } catch (error) {
    console.error("[shared-workout-service] Error fetching shared workout:", error)
    return { workout: null, error }
  }
}
