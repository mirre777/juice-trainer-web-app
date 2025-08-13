import { collection, getDocs, orderBy, query, where } from "firebase/firestore"
import { ErrorType, createError, logError } from "../utils/error-handler"
import { db } from "../db"
import { QueryDocumentSnapshot } from "firebase/firestore"
import { DocumentData } from "firebase/firestore"
import { WorkoutSet } from "./workout-service"
import { convertTimestampsToDates } from "../utils/date-utils"

export type WorkoutExercise = {
  id: string
  name: string
  createdAt: Date
  sets: WorkoutSet[],
  oneRepMax: number | null
}

function calculate1RM(weight: number, reps: number): number {
    // Epley's formula
    return Math.round(weight * (1 + reps / 30))
}

export async function getWorkoutExercises(userId: string, exerciseId: string): Promise<WorkoutExercise[]> {
  try {
    // Fetch exercise sessions
    const exercisesRef = collection(db, "users", userId, "workout_exercises")
    // get workoutExercise that match exerciseId and deleted is null in the last 3 months
    const q = query(exercisesRef,
        where("exerciseId", "==", exerciseId),
        where("deletedAt", "==", null),
        where("createdAt", ">=", new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000)),
        orderBy("createdAt", "desc")
    )

    const snapshot = await getDocs(q)
    const history: WorkoutExercise[] = []
    snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data()
      let max1RM: number | null = null
      data.sets.forEach((set: any) => {
        const weight = typeof set.weight === "number" ? set.weight : parseFloat(set.weight)
        const reps = typeof set.reps === "number" ? set.reps : parseInt(set.reps)
        if (!isNaN(weight) && !isNaN(reps) && reps > 0) {
          const oneRM = calculate1RM(weight, reps)
          if (max1RM === null || oneRM > max1RM) {
            max1RM = oneRM
          }
        }
      })
      history.push({
        id: doc.id,
        name: data.name,
        createdAt: data.createdAt.toDate(),
        sets: data.sets,
        oneRepMax: max1RM,
      })
    })
    return history
  } catch (error) {
    console.error("[workout-exercise-service] Unexpected error in getWorkoutExercises:", error)
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "getWorkoutExercises", userId },
      "Unexpected error fetching workout exercises",
    )
    logError(appError)
    return []
  }
}