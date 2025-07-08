import { useEffect, useState } from "react"
import { collection, getDocs, query, orderBy, QueryDocumentSnapshot, DocumentData, Firestore } from "firebase/firestore"
import { db as dbRaw } from "@/lib/firebase/firebase"

const db: Firestore = dbRaw as Firestore

interface ExerciseSession {
  id: string
  name: string
  createdAt: any
  sets: any[]
  oneRepMax: number | null
}

interface PersonalRecord {
  id: string
  exerciseName: string
  weight: number
  reps: number
  setId: string
  workoutId: string
  createdAt: any
  updatedAt: any
}

function calculate1RM(weight: number, reps: number): number {
  // Epley's formula
  return Math.round(weight * (1 + reps / 30))
}

function normalizeName(name: string | undefined) {
  return (name || "").trim().toLowerCase();
}

export function useExerciseHistory(userId: string, exerciseName: string, exerciseId?: string) {
  const [sessions, setSessions] = useState<ExerciseSession[]>([])
  const [prs, setPRs] = useState<PersonalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId || (!exerciseName && !exerciseId)) return
    setLoading(true)
    setError(null)

    const fetchHistoryAndPRs = async () => {
      try {
        // Fetch exercise sessions
        const exercisesRef = collection(db, "users", userId, "workout_exercises")
        const q = query(exercisesRef, orderBy("createdAt", "desc"))
        const snapshot = await getDocs(q)
        const history: ExerciseSession[] = []
        snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data()
          if (data.deletedAt) return
          if (exerciseId) {
            if (data.exerciseId !== exerciseId && data.name !== exerciseName) return
          } else {
            if (data.name !== exerciseName) return
          }
          const sets: any[] = data.sets || []
          let max1RM: number | null = null
          sets.forEach((set: any) => {
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
            createdAt: data.createdAt,
            sets,
            oneRepMax: max1RM,
          })
        })
        setSessions(history)

        // Fetch PRs from the user's personal_records collection only
        const userPrsRef = collection(db, "users", userId, "personal_records")
        const userPrsSnapshot = await getDocs(userPrsRef)
        const prs: PersonalRecord[] = []
        userPrsSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data()
          if (data.deletedAt) return
          // Robust match: if either exerciseId matches (if present) or exerciseName matches
          const prExerciseId = data.exerciseId;
          const prExerciseName = data.exerciseName;
          const idMatch = exerciseId && prExerciseId && prExerciseId === exerciseId;
          const nameMatch = normalizeName(prExerciseName) === normalizeName(exerciseName);
          if (!idMatch && !nameMatch) return;
          prs.push({
            id: doc.id,
            exerciseName: prExerciseName,
            weight: typeof data.weight === "number" ? data.weight : parseFloat(data.weight),
            reps: typeof data.reps === "number" ? data.reps : parseInt(data.reps),
            setId: data.setId,
            workoutId: data.workoutId,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          })
        })
        setPRs(prs)
      } catch (err: any) {
        setError(err.message || "Failed to fetch exercise history or PRs")
      } finally {
        setLoading(false)
      }
    }

    fetchHistoryAndPRs()
  }, [userId, exerciseName, exerciseId])

  return { sessions, prs, loading, error }
}
