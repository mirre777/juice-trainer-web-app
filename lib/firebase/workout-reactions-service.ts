import { doc, updateDoc, arrayUnion, serverTimestamp, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

// Add type guards and validation functions
function isValidEmoji(emoji: unknown): emoji is string {
  return typeof emoji === "string" && emoji.length > 0 && emoji.length <= 10
}

function isValidTrainerId(trainerId: unknown): trainerId is string {
  return typeof trainerId === "string" && trainerId.length > 0
}

function isValidWorkoutId(workoutId: unknown): workoutId is string {
  return typeof workoutId === "string" && workoutId.length > 0
}

function isValidUserId(userId: unknown): userId is string {
  return typeof userId === "string" && userId.length > 0
}

function isValidComment(comment: unknown): comment is string {
  return typeof comment === "string" && comment.trim().length > 0
}

// Add error boundary wrapper for all async functions
function withErrorBoundary<T extends any[], R>(fn: (...args: T) => Promise<R>, functionName: string) {
  return async (...args: T): Promise<R> => {
    try {
      console.log(`[${functionName}] Starting with args:`, args)
      const result = await fn(...args)
      console.log(`[${functionName}] Completed successfully`)
      return result
    } catch (error) {
      console.error(`[${functionName}] Error:`, error)
      throw new Error(`${functionName} failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }
}

interface WorkoutReaction {
  emoji: string
  trainerId: string
  timestamp: any // Firestore timestamp
}

interface WorkoutComment {
  comment: string
  trainerId: string
  timestamp: any
}

/**
 * Saves a reaction to a workout
 * @param userId - The user ID who owns the workout
 * @param workoutId - The workout ID
 * @param emoji - The emoji reaction
 * @param trainerId - The trainer ID who is reacting
 * @returns Promise<{ success: boolean }>
 */
export const saveWorkoutReaction = withErrorBoundary(
  async (userId: string, workoutId: string, emoji: string, trainerId: string): Promise<{ success: boolean }> => {
    // Comprehensive input validation
    if (!isValidUserId(userId)) {
      throw new Error("Invalid userId provided")
    }
    if (!isValidWorkoutId(workoutId)) {
      throw new Error("Invalid workoutId provided")
    }
    if (!isValidEmoji(emoji)) {
      throw new Error("Invalid emoji provided")
    }
    if (!isValidTrainerId(trainerId)) {
      throw new Error("Invalid trainerId provided")
    }

    console.log(`[WorkoutReactions] DEBUG: Starting saveWorkoutReaction with:`, {
      userId,
      workoutId,
      emoji,
      trainerId,
      timestamp: new Date().toISOString(),
    })

    console.log(`[WorkoutReactions] Adding reaction ${emoji} to workout ${workoutId} for user ${userId}`)

    // Validate Firebase imports
    if (!doc || typeof doc !== "function") {
      throw new Error("Firebase doc function is not available")
    }
    if (!updateDoc || typeof updateDoc !== "function") {
      throw new Error("Firebase updateDoc function is not available")
    }
    if (!arrayUnion || typeof arrayUnion !== "function") {
      throw new Error("Firebase arrayUnion function is not available")
    }
    if (!serverTimestamp || typeof serverTimestamp !== "function") {
      throw new Error("Firebase serverTimestamp function is not available")
    }
    if (!getDoc || typeof getDoc !== "function") {
      throw new Error("Firebase getDoc function is not available")
    }
    if (!db) {
      throw new Error("Firebase database is not initialized")
    }

    // Construct the workout document reference
    const workoutRef = doc(db, `users/${userId}/workouts/${workoutId}`)
    console.log(`[WorkoutReactions] DEBUG: Document path: users/${userId}/workouts/${workoutId}`)

    // First check if the document exists
    const workoutDoc = await getDoc(workoutRef)
    console.log(`[WorkoutReactions] DEBUG: Document exists: ${workoutDoc.exists()}`)

    if (!workoutDoc.exists()) {
      console.error(`[WorkoutReactions] ERROR: Workout document doesn't exist: users/${userId}/workouts/${workoutId}`)
      throw new Error(`Workout document doesn't exist: users/${userId}/workouts/${workoutId}`)
    }

    // Create the reaction object with regular Date (NOT serverTimestamp)
    const reaction = {
      emoji,
      trainerId,
      timestamp: new Date().toISOString(), // Use ISO string for consistency
    }

    console.log(`[WorkoutReactions] DEBUG: Created reaction object:`, reaction)

    // Validate reaction object
    if (!reaction.emoji || !reaction.trainerId || !reaction.timestamp) {
      console.error(`[WorkoutReactions] ERROR: Invalid reaction object:`, reaction)
      throw new Error("Invalid reaction object created")
    }

    // Update the document - this should work now
    console.log(`[WorkoutReactions] DEBUG: Attempting to update document with reaction`)
    await updateDoc(workoutRef, {
      reactions: arrayUnion(reaction),
      lastUpdated: serverTimestamp(), // Only use serverTimestamp at document level
    })

    console.log(`[WorkoutReactions] SUCCESS: Reaction added successfully to document`)
    return { success: true }
  },
  "saveWorkoutReaction",
)

/**
 * Gets all reactions for a workout
 * @param userId - The user ID who owns the workout
 * @param workoutId - The workout ID
 * @returns Promise<WorkoutReaction[]>
 */
export async function getWorkoutReactions(userId: string, workoutId: string): Promise<WorkoutReaction[]> {
  try {
    console.log(`[WorkoutReactions] Getting reactions for workout ${workoutId}`)

    // Reference to the workout document
    const workoutRef = doc(db, `users/${userId}/workouts/${workoutId}`)

    // Get the workout document
    const workoutDoc = await getDoc(workoutRef)

    if (!workoutDoc.exists()) {
      console.log(`[WorkoutReactions] Workout ${workoutId} not found`)
      return []
    }

    // Get the reactions from the workout document
    const workoutData = workoutDoc.data()
    const reactions = workoutData.reactions || []

    console.log(`[WorkoutReactions] Found ${reactions.length} reactions`)
    return reactions
  } catch (error) {
    console.error(`[WorkoutReactions] Error getting reactions:`, error)
    throw error
  }
}

/**
 * Checks if a trainer has already reacted to a workout
 * @param userId - The user ID who owns the workout
 * @param workoutId - The workout ID
 * @param trainerId - The trainer ID
 * @returns Promise<boolean>
 */
export async function hasTrainerReacted(userId: string, workoutId: string, trainerId: string): Promise<boolean> {
  try {
    const reactions = await getWorkoutReactions(userId, workoutId)
    return reactions.some((reaction) => reaction.trainerId === trainerId)
  } catch (error) {
    console.error(`[WorkoutReactions] Error checking if trainer has reacted:`, error)
    throw error
  }
}

/**
 * Gets reactions from a specific trainer
 * @param userId - The user ID who owns the workout
 * @param workoutId - The workout ID
 * @param trainerId - The trainer ID
 * @returns Promise<WorkoutReaction[]>
 */
export async function getTrainerReactions(
  userId: string,
  workoutId: string,
  trainerId: string,
): Promise<WorkoutReaction[]> {
  try {
    const reactions = await getWorkoutReactions(userId, workoutId)
    return reactions.filter((reaction) => reaction.trainerId === trainerId)
  } catch (error) {
    console.error(`[WorkoutReactions] Error getting trainer reactions:`, error)
    throw error
  }
}

/**
 * Check if a workout has any reactions
 */
export function hasReactions(workout: { reactions?: WorkoutReaction[] }): boolean {
  return Boolean(workout.reactions && workout.reactions.length > 0)
}

/**
 * Get the most recent reaction
 */
export function getLatestReaction(workout: { reactions?: WorkoutReaction[] }): WorkoutReaction | null {
  if (!workout.reactions || workout.reactions.length === 0) return null

  // Sort by timestamp (most recent first) and return the first one
  const sorted = [...workout.reactions].sort((a, b) => {
    // Handle Firestore timestamps
    const aTime = a.timestamp?.toDate?.() || a.timestamp
    const bTime = b.timestamp?.toDate?.() || b.timestamp
    return new Date(bTime).getTime() - new Date(aTime).getTime()
  })

  return sorted[0]
}

/**
 * Saves a comment to a workout
 * @param userId - The user ID who owns the workout
 * @param workoutId - The workout ID
 * @param comment - The comment text
 * @param trainerId - The trainer ID who is commenting
 * @returns Promise<{ success: boolean }>
 */
export const saveWorkoutComment = withErrorBoundary(
  async (userId: string, workoutId: string, comment: string, trainerId: string): Promise<{ success: boolean }> => {
    // Comprehensive input validation
    if (!isValidUserId(userId)) {
      throw new Error("Invalid userId provided")
    }
    if (!isValidWorkoutId(workoutId)) {
      throw new Error("Invalid workoutId provided")
    }
    if (!isValidComment(comment)) {
      throw new Error("Invalid comment provided")
    }
    if (!isValidTrainerId(trainerId)) {
      throw new Error("Invalid trainerId provided")
    }

    console.log(`[WorkoutComments] DEBUG: Starting saveWorkoutComment with:`, {
      userId,
      workoutId,
      commentLength: comment?.length,
      trainerId,
      timestamp: new Date().toISOString(),
    })

    console.log(`[WorkoutReactions] Adding comment to workout ${workoutId} for user ${userId}`)

    // Validate Firebase imports
    if (!doc || typeof doc !== "function") {
      throw new Error("Firebase doc function is not available")
    }
    if (!updateDoc || typeof updateDoc !== "function") {
      throw new Error("Firebase updateDoc function is not available")
    }
    if (!arrayUnion || typeof arrayUnion !== "function") {
      throw new Error("Firebase arrayUnion function is not available")
    }
    if (!serverTimestamp || typeof serverTimestamp !== "function") {
      throw new Error("Firebase serverTimestamp function is not available")
    }
    if (!getDoc || typeof getDoc !== "function") {
      throw new Error("Firebase getDoc function is not available")
    }
    if (!db) {
      throw new Error("Firebase database is not initialized")
    }

    // Construct the workout document reference
    const workoutRef = doc(db, `users/${userId}/workouts/${workoutId}`)
    console.log(`[WorkoutComments] DEBUG: Document path: users/${userId}/workouts/${workoutId}`)

    // First check if the document exists
    const workoutDoc = await getDoc(workoutRef)
    console.log(`[WorkoutComments] DEBUG: Document exists: ${workoutDoc.exists()}`)

    if (workoutDoc.exists()) {
      console.log(`[WorkoutComments] DEBUG: Document data:`, workoutDoc.data())
    }

    if (!workoutDoc.exists()) {
      console.error(`[WorkoutComments] ERROR: Workout document doesn't exist: users/${userId}/workouts/${workoutId}`)
      throw new Error(`Workout document doesn't exist: users/${userId}/workouts/${workoutId}`)
    }

    // Create the comment object with regular Date (NOT serverTimestamp)
    const commentObj = {
      comment: comment.trim(),
      trainerId,
      timestamp: new Date().toISOString(), // Use ISO string for consistency
    }

    console.log(`[WorkoutComments] DEBUG: Created comment object:`, commentObj)

    // Validate comment object
    if (!commentObj.comment || !commentObj.trainerId || !commentObj.timestamp) {
      console.error(`[WorkoutComments] ERROR: Invalid comment object:`, commentObj)
      throw new Error("Invalid comment object created")
    }

    // Update the document - this should work now
    console.log(`[WorkoutComments] DEBUG: Attempting to update document with comment`)
    await updateDoc(workoutRef, {
      comments: arrayUnion(commentObj),
      lastUpdated: serverTimestamp(), // Only use serverTimestamp at document level
    })

    console.log(`[WorkoutComments] SUCCESS: Comment added successfully to document`)
    return { success: true }
  },
  "saveWorkoutComment",
)

/**
 * Gets all comments for a workout
 * @param userId - The user ID who owns the workout
 * @param workoutId - The workout ID
 * @returns Promise<WorkoutComment[]>
 */
export async function getWorkoutComments(userId: string, workoutId: string): Promise<WorkoutComment[]> {
  try {
    console.log(`[WorkoutComments] Getting comments for workout ${workoutId}`)

    // Reference to the workout document
    const workoutRef = doc(db, `users/${userId}/workouts/${workoutId}`)

    // Get the workout document
    const workoutDoc = await getDoc(workoutRef)

    if (!workoutDoc.exists()) {
      console.log(`[WorkoutComments] Workout ${workoutId} not found`)
      return []
    }

    // Get the comments from the workout document
    const workoutData = workoutDoc.data()
    const comments = workoutData.comments || []

    console.log(`[WorkoutComments] Found ${comments.length} comments`)
    return comments
  } catch (error) {
    console.error(`[WorkoutComments] Error getting comments:`, error)
    throw error
  }
}

/**
 * Check if a workout has any comments
 */
export function hasComments(workout: { comments?: WorkoutComment[] }): boolean {
  return Boolean(workout.comments && workout.comments.length > 0)
}

/**
 * Get the most recent comment
 */
export function getLatestComment(workout: { comments?: WorkoutComment[] }): WorkoutComment | null {
  if (!workout.comments || workout.comments.length === 0) return null

  // Sort by timestamp (most recent first) and return the first one
  const sorted = [...workout.comments].sort((a, b) => {
    // Handle Firestore timestamps
    const aTime = a.timestamp?.toDate?.() || a.timestamp
    const bTime = b.timestamp?.toDate?.() || b.timestamp
    return new Date(bTime).getTime() - new Date(aTime).getTime()
  })

  return sorted[0]
}

/**
 * Add reaction to workout document
 */
export async function addReactionToWorkout(
  workoutDocPath: string,
  emoji: string,
  trainerId = "trainer_unknown",
): Promise<void> {
  try {
    console.log(`[WorkoutReactions] Adding reaction ${emoji} to workout at ${workoutDocPath}`)

    const workoutRef = doc(db, workoutDocPath)

    // Check if document exists
    const docSnap = await getDoc(workoutRef)
    if (!docSnap.exists()) {
      throw new Error(`Workout document doesn't exist at path: ${workoutDocPath}`)
    }

    // Add reaction
    await updateDoc(workoutRef, {
      reactions: arrayUnion({
        emoji,
        trainerId,
        timestamp: new Date(),
      }),
      updatedAt: serverTimestamp(),
    })

    console.log(`[WorkoutReactions] Reaction added successfully`)
  } catch (error) {
    console.error(`[WorkoutReactions] Error adding reaction:`, error)
    throw error
  }
}

/**
 * Add comment to workout document
 */
export async function addCommentToWorkout(
  workoutDocPath: string,
  comment: string,
  trainerId = "trainer_unknown",
): Promise<void> {
  try {
    console.log(`[WorkoutReactions] Adding comment to workout at ${workoutDocPath}`)

    const workoutRef = doc(db, workoutDocPath)

    // Check if document exists
    const docSnap = await getDoc(workoutRef)
    if (!docSnap.exists()) {
      throw new Error(`Workout document doesn't exist at path: ${workoutDocPath}`)
    }

    // Add comment
    await updateDoc(workoutRef, {
      comments: arrayUnion({
        comment: comment.trim(),
        trainerId,
        timestamp: new Date(),
      }),
      updatedAt: serverTimestamp(),
    })

    console.log(`[WorkoutReactions] Comment added successfully`)
  } catch (error) {
    console.error(`[WorkoutReactions] Error adding comment:`, error)
    throw error
  }
}
