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
  serverTimestamp,
  addDoc,
} from "firebase/firestore"
import { ErrorType, createError, logError, tryCatch, type AppError } from "@/lib/utils/error-handler"

// Interface for workout data
export interface Workout {
  id?: string
  name: string
  description?: string
  date?: any // Firestore timestamp or Date
  exercises?: any[]
  clientId?: string
  trainerId?: string
  status?: "assigned" | "in-progress" | "completed" | "missed"
  completion?: number
  feedback?: string
  rating?: number
  createdAt?: any
  updatedAt?: any
}

export interface WorkoutSet {
  id: string
  notes?: string
  reps: string
  type: string
  weight: number
}

export interface WorkoutExercise {
  id: string
  name: string
  sets: WorkoutSet[]
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
export async function getWorkoutById(trainerId: string, clientId: string, workoutId: string): Promise<Workout | null> {
  try {
    if (!trainerId || !clientId || !workoutId) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "getWorkoutById" },
        "Trainer ID, client ID, and workout ID are required",
      )
      logError(error)
      return null
    }

    const workoutRef = doc(db, "users", trainerId, "clients", clientId, "workouts", workoutId)
    const [workoutDoc, error] = await tryCatch(() => getDoc(workoutRef), ErrorType.DB_READ_FAILED, {
      function: "getWorkoutById",
      trainerId,
      clientId,
      workoutId,
    })

    if (error || !workoutDoc) {
      return null
    }

    if (!workoutDoc.exists()) {
      const error = createError(
        ErrorType.DB_DOCUMENT_NOT_FOUND,
        null,
        { function: "getWorkoutById", trainerId, clientId, workoutId },
        "Workout not found",
      )
      logError(error)
      return null
    }

    const data = workoutDoc.data()
    return {
      id: workoutDoc.id,
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
    }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "getWorkoutById", trainerId, clientId, workoutId },
      "Unexpected error fetching workout",
    )
    logError(appError)
    return null
  }
}

// Create a new workout for a client
export async function createClientWorkout(
  trainerId: string,
  clientId: string,
  workoutData: Partial<Workout>,
): Promise<{ success: boolean; workoutId?: string; error?: any }> {
  try {
    if (!trainerId || !clientId) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "createClientWorkout" },
        "Trainer ID and client ID are required",
      )
      logError(error)
      return { success: false, error }
    }

    // Ensure required fields
    if (!workoutData.name) {
      const error = createError(
        ErrorType.API_VALIDATION_FAILED,
        null,
        { function: "createClientWorkout" },
        "Workout name is required",
      )
      logError(error)
      return { success: false, error }
    }

    // Create the workout document data
    const workoutDocData = {
      ...workoutData,
      clientId: clientId,
      trainerId: trainerId,
      status: workoutData.status || "assigned",
      completion: workoutData.completion || 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    // Create a new workout document
    const workoutsCollectionRef = collection(db, "users", trainerId, "clients", clientId, "workouts")
    const [newWorkoutRef, error] = await tryCatch(
      () => addDoc(workoutsCollectionRef, workoutDocData),
      ErrorType.DB_WRITE_FAILED,
      { function: "createClientWorkout", trainerId, clientId },
    )

    if (error || !newWorkoutRef) {
      return { success: false, error }
    }

    // Update the document with its own ID
    await updateDoc(newWorkoutRef, {
      id: newWorkoutRef.id,
    })

    return {
      success: true,
      workoutId: newWorkoutRef.id,
    }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "createClientWorkout", trainerId, clientId },
      "Unexpected error creating workout",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}

// Update a workout
export async function updateClientWorkout(
  trainerId: string,
  clientId: string,
  workoutId: string,
  updates: Partial<Workout>,
): Promise<{ success: boolean; error?: any }> {
  try {
    if (!trainerId || !clientId || !workoutId) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "updateClientWorkout" },
        "Trainer ID, client ID, and workout ID are required",
      )
      logError(error)
      return { success: false, error }
    }

    // Remove fields that shouldn't be directly updated
    const { id, createdAt, ...validUpdates } = updates as any

    const workoutRef = doc(db, "users", trainerId, "clients", clientId, "workouts", workoutId)

    const [, updateError] = await tryCatch(
      () =>
        updateDoc(workoutRef, {
          ...validUpdates,
          updatedAt: serverTimestamp(),
        }),
      ErrorType.DB_WRITE_FAILED,
      { function: "updateClientWorkout", trainerId, clientId, workoutId },
    )

    if (updateError) {
      return { success: false, error: updateError }
    }

    return { success: true }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "updateClientWorkout", trainerId, clientId, workoutId, updates },
      "Unexpected error updating workout",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}

// Delete a workout
export async function deleteClientWorkout(
  trainerId: string,
  clientId: string,
  workoutId: string,
): Promise<{ success: boolean; error?: any }> {
  try {
    if (!trainerId || !clientId || !workoutId) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "deleteClientWorkout" },
        "Trainer ID, client ID, and workout ID are required",
      )
      logError(error)
      return { success: false, error }
    }

    const workoutRef = doc(db, "users", trainerId, "clients", clientId, "workouts", workoutId)

    const [, deleteError] = await tryCatch(() => deleteDoc(workoutRef), ErrorType.DB_DELETE_FAILED, {
      function: "deleteClientWorkout",
      trainerId,
      clientId,
      workoutId,
    })

    if (deleteError) {
      return { success: false, error: deleteError }
    }

    return { success: true }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "deleteClientWorkout", trainerId, clientId, workoutId },
      "Unexpected error deleting workout",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}

// Get the latest workout for a client
export async function getLatestClientWorkout(trainerId: string, clientId: string): Promise<Workout | null> {
  try {
    if (!trainerId || !clientId) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "getLatestClientWorkout" },
        "Trainer ID and client ID are required",
      )
      logError(error)
      return null
    }

    const workoutsCollectionRef = collection(db, "users", trainerId, "clients", clientId, "workouts")
    const q = query(workoutsCollectionRef, orderBy("date", "desc"), limit(1))

    const [workoutsSnapshot, error] = await tryCatch(() => getDocs(q), ErrorType.DB_READ_FAILED, {
      function: "getLatestClientWorkout",
      trainerId,
      clientId,
    })

    if (error || !workoutsSnapshot || workoutsSnapshot.empty) {
      return null
    }

    const doc = workoutsSnapshot.docs[0]
    const data = doc.data()

    return {
      id: doc.id,
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
    }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "getLatestClientWorkout", trainerId, clientId },
      "Unexpected error fetching latest client workout",
    )
    logError(appError)
    return null
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

export type WorkoutProgram = {
  id?: string
  name: string
  description?: string
  weeks: ExerciseWeek[]
  createdAt?: any
  updatedAt?: any
}

export type WorkoutRoutine = {
  id?: string
  name: string
  exercises: any[]
  createdAt?: any
  updatedAt?: any
}

export type ExerciseWeek = {
  id?: string
  weekNumber: number
  days: any[]
  createdAt?: any
  updatedAt?: any
}

export async function getWorkoutProgram(
  userId: string,
  programId: string,
): Promise<[WorkoutProgram | null, AppError | null]> {
  try {
    const programRef = doc(db, "users", userId, "workoutPrograms", programId)
    const programSnap = await getDoc(programRef)

    if (!programSnap.exists()) {
      const error = createError(
        ErrorType.DB_DOCUMENT_NOT_FOUND,
        null,
        { userId, programId },
        "Workout program not found.",
      )
      logError(error)
      return [null, error]
    }

    return [programSnap.data() as WorkoutProgram, null]
  } catch (error: any) {
    const appError = createError(
      ErrorType.DB_READ_FAILED,
      error,
      { userId, programId, service: "Firebase" },
      "Failed to fetch workout program.",
    )
    logError(appError)
    return [null, appError]
  }
}

export async function getAllWorkoutPrograms(userId: string): Promise<[WorkoutProgram[], AppError | null]> {
  try {
    const programsRef = collection(db, "users", userId, "workoutPrograms")
    const q = query(programsRef, orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)

    const programs: WorkoutProgram[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as WorkoutProgram[]

    return [programs, null]
  } catch (error: any) {
    const appError = createError(
      ErrorType.DB_READ_FAILED,
      error,
      { userId, service: "Firebase" },
      "Failed to fetch all workout programs.",
    )
    logError(appError)
    return [null, appError]
  }
}

export async function createWorkoutProgram(
  userId: string,
  program: WorkoutProgram,
): Promise<[string | null, AppError | null]> {
  try {
    const programsRef = collection(db, "users", userId, "workoutPrograms")
    const docRef = await addDoc(programsRef, {
      ...program,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return [docRef.id, null]
  } catch (error: any) {
    const appError = createError(
      ErrorType.DB_WRITE_FAILED,
      error,
      { userId, service: "Firebase", operation: "createWorkoutProgram" },
      "Failed to create workout program.",
    )
    logError(appError)
    return [null, appError]
  }
}

export async function updateWorkoutProgram(
  userId: string,
  programId: string,
  programData: Partial<WorkoutProgram>,
): Promise<[boolean, AppError | null]> {
  try {
    const programRef = doc(db, "users", userId, "workoutPrograms", programId)
    await updateDoc(programRef, {
      ...programData,
      updatedAt: serverTimestamp(),
    })
    return [true, null]
  } catch (error: any) {
    const appError = createError(
      ErrorType.DB_WRITE_FAILED,
      error,
      { userId, programId, service: "Firebase", operation: "updateWorkoutProgram" },
      "Failed to update workout program.",
    )
    logError(appError)
    return [false, appError]
  }
}

export async function deleteWorkoutProgram(userId: string, programId: string): Promise<[boolean, AppError | null]> {
  try {
    const programRef = doc(db, "users", userId, "workoutPrograms", programId)
    await deleteDoc(programRef)
    return [true, null]
  } catch (error: any) {
    const appError = createError(
      ErrorType.DB_DELETE_FAILED,
      error,
      { userId, programId, service: "Firebase", operation: "deleteWorkoutProgram" },
      "Failed to delete workout program.",
    )
    logError(appError)
    return [false, appError]
  }
}
