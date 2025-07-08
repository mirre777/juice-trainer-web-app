import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { ErrorType, createError, logError, tryCatch } from "@/lib/utils/error-handler"

// Interface for workout data
export interface WorkoutSet {
  id: string
  reps: string
  weight: string
  completed: boolean
  notes?: string
}

export interface WorkoutExercise {
  id: string
  name: string
  sets: WorkoutSet[]
  completed: boolean
  notes?: string
}

export interface Workout {
  id: string
  name: string
  clientId: string
  trainerId: string
  exercises: WorkoutExercise[]
  status: "pending" | "in_progress" | "completed"
  scheduledDate?: Timestamp
  completedDate?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
  notes?: string
}

export interface FirebaseWorkout {
  id: string
  name: string
  notes?: string
  startedAt: string
  completedAt?: string
  createdAt: string
  duration?: number
  status: string
  exercises: WorkoutExercise[]

  // Additional fields derived for the UI
  day?: string
  focus?: string
  clientName?: string
  clientImage?: string
  date?: string
  programWeek?: string
  programTotal?: string
  daysCompleted?: string
  daysTotal?: string
  clientNote?: string
  progress?: {
    completed: number
    total: number
  }
  personalRecords?: {
    exercise: string
    weight: string
    reps: string | number
    date: string
    isPR?: boolean
  }[]
}

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

    // If we get here, the date is invalid
    console.warn("Invalid date format:", dateString)
    return "Invalid date format"
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "formatFirestoreDate", dateString },
      "Error formatting date",
    )
    logError(appError)
    return "Error formatting date"
  }
}

// Get all workouts for a specific client
export async function getClientWorkouts(trainerId: string, clientId: string): Promise<Workout[]> {
  try {
    console.log(`[workout-service] Fetching workouts for client: ${clientId} (trainer: ${trainerId})`)

    if (!trainerId || !clientId) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "getClientWorkouts" },
        "Trainer ID and client ID are required",
      )
      logError(error)
      return []
    }

    // Path: users/{trainerId}/clients/{clientId}/workouts
    const workoutsCollectionRef = collection(db, "users", trainerId, "clients", clientId, "workouts")
    const q = query(workoutsCollectionRef, orderBy("date", "desc"))

    const [workoutsSnapshot, error] = await tryCatch(() => getDocs(q), ErrorType.DB_READ_FAILED, {
      function: "getClientWorkouts",
      trainerId,
      clientId,
    })

    if (error || !workoutsSnapshot) {
      console.error("[workout-service] Error fetching workouts:", error)
      return []
    }

    console.log(`[workout-service] Found ${workoutsSnapshot.size} workouts for client ${clientId}`)

    const workouts: Workout[] = []
    workoutsSnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data()
      workouts.push({
        id: docSnapshot.id,
        name: data.name || "Unnamed Workout",
        description: data.description || "",
        date: data.date || null,
        exercises: data.exercises || [],
        clientId: clientId,
        trainerId: trainerId,
        status: data.status || "assigned",
        completion: data.completion || 0,
        feedback: data.feedback || "",
        rating: data.rating || 0,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      })
    })

    return workouts
  } catch (error) {
    console.error("[workout-service] Unexpected error in getClientWorkouts:", error)
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "getClientWorkouts", trainerId, clientId },
      "Unexpected error fetching client workouts",
    )
    logError(appError)
    return []
  }
}

// Get a specific workout by ID
export async function getWorkout(trainerId: string, workoutId: string): Promise<Workout | null> {
  try {
    if (!trainerId || !workoutId) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "getWorkout" },
        "Trainer ID and workout ID are required",
      )
      logError(error)
      return null
    }

    const workoutRef = doc(db, "users", trainerId, "workouts", workoutId)
    const [workoutDoc, error] = await tryCatch(() => getDoc(workoutRef), ErrorType.DB_READ_FAILED, {
      function: "getWorkout",
      trainerId,
      workoutId,
    })

    if (error || !workoutDoc) {
      return null
    }

    if (!workoutDoc.exists()) {
      const error = createError(
        ErrorType.DB_DOCUMENT_NOT_FOUND,
        null,
        { function: "getWorkout", trainerId, workoutId },
        "Workout not found",
      )
      logError(error)
      return null
    }

    const data = workoutDoc.data()
    return {
      id: workoutDoc.id,
      name: data.name || "Unnamed Workout",
      clientId: data.clientId,
      trainerId: trainerId,
      exercises: data.exercises || [],
      status: data.status || "pending",
      scheduledDate: data.scheduledDate || null,
      completedDate: data.completedDate || null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      notes: data.notes || "",
    } as Workout
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "getWorkout", trainerId, workoutId },
      "Unexpected error fetching workout",
    )
    logError(appError)
    return null
  }
}

// Create a new workout for a client
export async function createWorkout(
  trainerId: string,
  workoutData: Omit<Workout, "id" | "createdAt" | "updatedAt">,
): Promise<{ success: boolean; workoutId?: string; error?: any }> {
  try {
    if (!trainerId) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "createWorkout" },
        "Trainer ID is required",
      )
      logError(error)
      return { success: false, error }
    }

    const workoutId = doc(collection(db, "users", trainerId, "workouts")).id

    const workout: Workout = {
      ...workoutData,
      id: workoutId,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    }

    await setDoc(doc(db, "users", trainerId, "workouts", workoutId), workout)

    return {
      success: true,
      workoutId: workoutId,
    }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "createWorkout", trainerId },
      "Unexpected error creating workout",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}

// Update a workout
export async function updateWorkout(
  trainerId: string,
  workoutId: string,
  updates: Partial<Workout>,
): Promise<{ success: boolean; error?: any }> {
  try {
    if (!trainerId || !workoutId) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "updateWorkout" },
        "Trainer ID and workout ID are required",
      )
      logError(error)
      return { success: false, error }
    }

    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    }

    await updateDoc(doc(db, "users", trainerId, "workouts", workoutId), updateData)

    return { success: true }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "updateWorkout", trainerId, workoutId, updates },
      "Unexpected error updating workout",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}

// Delete a workout
export async function deleteWorkout(trainerId: string, workoutId: string): Promise<{ success: boolean; error?: any }> {
  try {
    if (!trainerId || !workoutId) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "deleteWorkout" },
        "Trainer ID and workout ID are required",
      )
      logError(error)
      return { success: false, error }
    }

    await deleteDoc(doc(db, "users", trainerId, "workouts", workoutId))

    return { success: true }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "deleteWorkout", trainerId, workoutId },
      "Unexpected error deleting workout",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}

// Get all workouts for a specific user by first looking up the client document to get the userId
export async function getUserWorkouts(userId: string): Promise<{ workouts: FirebaseWorkout[]; error: any }> {
  try {
    console.log(`[workout-service] getUserWorkouts called with userId: ${userId}`)

    if (!userId) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "getUserWorkouts" },
        "User ID is required",
      )
      logError(error)
      return { workouts: [], error }
    }

    // Directly fetch workouts from the user's workouts collection
    const workoutsRef = collection(db, `users/${userId}/workouts`)
    console.log(`[workout-service] Fetching from path: users/${userId}/workouts`)

    // Try to get workouts without any ordering first
    let querySnapshot
    let queryError

    try {
      // First attempt: Try with simple query without ordering
      console.log("[workout-service] Attempting to fetch workouts without ordering")
      querySnapshot = await getDocs(workoutsRef)
      console.log(`[workout-service] Successfully fetched workouts without ordering: ${querySnapshot.docs.length}`)
    } catch (err) {
      console.error("[workout-service] Error fetching workouts without ordering:", err)
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        stack: err.stack,
      })

      try {
        // Second attempt: Try with ordering by createdAt if it exists
        console.log("[workout-service] Attempting to fetch workouts with createdAt ordering")
        const orderedQuery = query(workoutsRef, orderBy("createdAt", "desc"), limit(20))
        querySnapshot = await getDocs(orderedQuery)
        console.log(
          `[workout-service] Successfully fetched workouts with createdAt ordering: ${querySnapshot.docs.length}`,
        )
      } catch (orderErr) {
        console.error("[workout-service] Error fetching workouts with createdAt ordering:", orderErr)
        console.error("Error details:", {
          message: orderErr.message,
          code: orderErr.code,
          stack: orderErr.stack,
        })
        queryError = orderErr
      }
    }

    if (queryError || !querySnapshot) {
      console.log("[workout-service] All attempts to fetch workouts failed:", queryError)
      return { workouts: [], error: queryError }
    }

    console.log(`[workout-service] Found workouts: ${querySnapshot.docs.length}`)

    const workouts: FirebaseWorkout[] = []

    for (const docSnapshot of querySnapshot.docs) {
      try {
        const data = docSnapshot.data()
        console.log("[workout-service] Raw workout data:", data)

        // Format the workout data
        const workout: FirebaseWorkout = {
          id: docSnapshot.id,
          name: data.name || "N/A",
          notes: data.notes || "",
          startedAt: data.startedAt || "N/A",
          completedAt: data.completedAt || null, // Ensure null if not present
          createdAt: data.createdAt || "N/A",
          duration: data.duration || 0,
          status: data.status || "N/A",
          exercises: data.exercises || [],

          // Derived fields for UI
          day: "N/A", // We'll calculate this based on the workout sequence
          focus: data.name || "N/A", // Use the workout name as the focus
          date:
            data.startedAt && data.startedAt.seconds
              ? formatFirestoreDate({
                  seconds: data.startedAt.seconds,
                  nanoseconds: data.startedAt.nanoseconds,
                })
              : formatFirestoreDate(data.startedAt),
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
                (prev, current) => (current.weight > prev.weight ? current : prev),
                exercise.sets[0],
              )

              if (maxWeightSet && maxWeightSet.weight > 0) {
                personalRecords.push({
                  exercise: exercise.name,
                  weight: `${maxWeightSet.weight} kg`,
                  reps: maxWeightSet.reps,
                  date: formatFirestoreDate(data.completedAt || data.startedAt),
                  isPR: true, // For demo purposes, we'll mark all as PRs
                })
              }
            }
          }

          if (personalRecords.length > 0) {
            workout.personalRecords = personalRecords
          }
        }

        workouts.push(workout)
      } catch (docError) {
        console.error("[workout-service] Error processing workout document:", docError)
        console.error("Document ID:", docSnapshot.id)
        // Continue with the next document instead of failing the entire function
      }
    }

    return { workouts, error: null }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "getUserWorkouts" },
      "Unexpected error fetching user workouts",
    )
    logError(appError)
    return { workouts: [], error: appError }
  }
}

// Get a specific workout by ID for a user by first looking up the client document to get the userId
export async function getUserWorkoutById(
  trainerId: string,
  clientId: string,
  workoutId: string,
): Promise<{ workout: FirebaseWorkout | null; error: any }> {
  try {
    console.log(
      `[workout-service] getUserWorkoutById called with trainerId: ${trainerId}, clientId: ${clientId}, workoutId: ${workoutId}`,
    )

    if (!trainerId || !clientId || !workoutId) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "getUserWorkoutById" },
        "Trainer ID, client ID, and workout ID are required",
      )
      logError(error)
      return { workout: null, error }
    }

    // Step 1: Look up the client document to get the userId
    const clientRef = doc(db, "users", trainerId, "clients", clientId)
    const clientDoc = await getDoc(clientRef)

    if (!clientDoc.exists()) {
      const error = createError(
        ErrorType.DB_DOCUMENT_NOT_FOUND,
        null,
        { function: "getUserWorkoutById", trainerId, clientId },
        "Client document not found",
      )
      logError(error)
      return { workout: null, error }
    }

    const clientData = clientDoc.data()
    const userId = clientData.userId

    if (!userId) {
      const error = createError(
        ErrorType.DB_FIELD_MISSING,
        null,
        { function: "getUserWorkoutById", trainerId, clientId },
        "Client document does not contain userId",
      )
      logError(error)
      return { workout: null, error }
    }

    console.log(`[workout-service] Found userId: ${userId} for client: ${clientId}`)

    // Step 2: Use the userId to fetch the specific workout from users/{userId}/workouts/{workoutId}
    const workoutRef = doc(db, `users/${userId}/workouts/${workoutId}`)
    console.log(`[workout-service] Fetching from path: users/${userId}/workouts/${workoutId}`)

    const workoutDoc = await getDoc(workoutRef)

    if (!workoutDoc.exists()) {
      console.log(`[workout-service] Workout not found: ${workoutId}`)
      return { workout: null, error: null }
    }

    const data = workoutDoc.data()
    console.log("[workout-service] Raw workout data:", data)

    // Format the workout data
    const workout: FirebaseWorkout = {
      id: workoutDoc.id,
      name: data.name || "N/A",
      notes: data.notes || "",
      startedAt: data.startedAt || "N/A",
      completedAt: data.completedAt || null, // Ensure null if not present
      createdAt: data.createdAt || "N/A",
      duration: data.duration || 0,
      status: data.status || "N/A",
      exercises: data.exercises || [],

      // Derived fields for UI
      day: "N/A",
      focus: data.name || "N/A",
      clientName: clientData.name || "Client",
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
            (prev, current) => (current.weight > prev.weight ? current : prev),
            exercise.sets[0],
          )

          if (maxWeightSet && maxWeightSet.weight > 0) {
            personalRecords.push({
              exercise: exercise.name,
              weight: `${maxWeightSet.weight} kg`,
              reps: maxWeightSet.reps,
              date: formatFirestoreDate(data.completedAt || data.startedAt),
              isPR: true, // For demo purposes, we'll mark all as PRs
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
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "getUserWorkoutById" },
      "Unexpected error fetching user workout by ID",
    )
    logError(appError)
    return { workout: null, error: appError }
  }
}

// Get the latest workout for a user by first looking up the client document to get the userId
export async function getLatestWorkoutForUser(
  trainerId: string,
  clientId: string,
): Promise<{ workout: FirebaseWorkout | null; error: any }> {
  try {
    console.log(`[workout-service] getLatestWorkoutForUser called with trainerId: ${trainerId}, clientId: ${clientId}`)

    if (!trainerId || !clientId) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "getLatestWorkoutForUser" },
        "Trainer ID and client ID are required",
      )
      logError(error)
      return { workout: null, error }
    }

    // Step 1: Look up the client document to get the userId
    const clientRef = doc(db, "users", trainerId, "clients", clientId)
    const clientDoc = await getDoc(clientRef)

    if (!clientDoc.exists()) {
      const error = createError(
        ErrorType.DB_DOCUMENT_NOT_FOUND,
        null,
        { function: "getLatestWorkoutForUser", trainerId, clientId },
        "Client document not found",
      )
      logError(error)
      return { workout: null, error }
    }

    const clientData = clientDoc.data()
    const userId = clientData.userId

    if (!userId) {
      const error = createError(
        ErrorType.DB_FIELD_MISSING,
        null,
        { function: "getLatestWorkoutForUser", trainerId, clientId },
        "Client document does not contain userId",
      )
      logError(error)
      return { workout: null, error }
    }

    console.log(`[workout-service] Found userId: ${userId} for client: ${clientId}`)

    // Step 2: Use the userId to fetch the latest workout from users/{userId}/workouts/
    const workoutsRef = collection(db, `users/${userId}/workouts`)
    console.log(`[workout-service] Fetching latest workout from path: users/${userId}/workouts`)

    // Query for the latest workout by createdAt
    const q = query(workoutsRef, orderBy("createdAt", "desc"), limit(1))
    const workoutsSnapshot = await getDocs(q)

    if (workoutsSnapshot.empty) {
      console.log(`[workout-service] No workouts found for user: ${userId}`)
      return { workout: null, error: null }
    }

    const doc = workoutsSnapshot.docs[0]
    const data = doc.data()
    console.log("[workout-service] Raw latest workout data:", data)

    // Format the workout data
    const workout: FirebaseWorkout = {
      id: doc.id,
      name: data.name || "N/A",
      notes: data.notes || "",
      startedAt: data.startedAt || "N/A",
      completedAt: data.completedAt || null, // Ensure null if not present
      createdAt: data.createdAt || "N/A",
      duration: data.duration || 0,
      status: data.status || "N/A",
      exercises: data.exercises || [],

      // Derived fields for UI
      day: "N/A",
      focus: data.name || "N/A",
      clientName: clientData.name || "Client",
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
            (prev, current) => (current.weight > prev.weight ? current : prev),
            exercise.sets[0],
          )

          if (maxWeightSet && maxWeightSet.weight > 0) {
            personalRecords.push({
              exercise: exercise.name,
              weight: `${maxWeightSet.weight} kg`,
              reps: maxWeightSet.reps,
              date: formatFirestoreDate(data.completedAt || data.startedAt),
              isPR: true, // For demo purposes, we'll mark all as PRs
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
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "getLatestWorkoutForUser" },
      "Unexpected error fetching latest user workout",
    )
    logError(appError)
    return { workout: null, error: appError }
  }
}
</merged_code>
