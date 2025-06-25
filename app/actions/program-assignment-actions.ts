"use server"

import { getFirebaseAdminAuth, initializeFirebaseAdmin } from "@/lib/firebase/firebase-admin"
import { getFirebaseAdminFirestore } from "@/lib/firebase/firebase-admin"
import { createError, ErrorType, logError, type AppError } from "@/lib/utils/error-handler" // Corrected import
import type { WorkoutProgram } from "@/types/workout-program"
import { cookies } from "next/headers"

// Initialize Firebase Admin SDK
initializeFirebaseAdmin()

export async function sendProgramToClient(
  program: WorkoutProgram,
  clientId: string,
): Promise<{ success: boolean; message: string; error?: AppError }> {
  const cookieStore = cookies()
  const idToken = cookieStore.get("auth_token")?.value

  if (!idToken) {
    const error = createError(
      ErrorType.AUTH_UNAUTHORIZED,
      null,
      { action: "sendProgramToClient" },
      "Authentication token missing.",
    )
    logError(error)
    return { success: false, message: "Authentication required.", error }
  }

  let trainerId: string
  try {
    const decodedToken = await getFirebaseAdminAuth().verifyIdToken(idToken)
    trainerId = decodedToken.uid
  } catch (e: any) {
    const error = createError(
      ErrorType.AUTH_TOKEN_INVALID,
      e,
      { action: "sendProgramToClient" },
      "Invalid or expired authentication token.",
    )
    logError(error)
    return { success: false, message: "Authentication failed. Please log in again.", error }
  }

  const firestore = getFirebaseAdminFirestore()

  try {
    // 1. Save the program to the trainer's programs collection
    const programRef = firestore.collection(`users/${trainerId}/workoutPrograms`).doc()
    await programRef.set({
      ...program,
      id: programRef.id, // Ensure the ID is stored within the document
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
      assignedTo: clientId, // Mark as assigned to this client
    })

    // 2. Assign the program to the client
    const clientRef = firestore.collection(`users/${trainerId}/clients`).doc(clientId)
    await clientRef.update({
      assignedProgramId: programRef.id,
      assignedProgramName: program.program_title, // Store the name for easy display
      assignedAt: firestore.FieldValue.serverTimestamp(),
    })

    // 3. (Optional) Send notification to client - placeholder
    console.log(`Program ${program.program_title} (${programRef.id}) assigned to client ${clientId}`)

    return { success: true, message: `Program "${program.program_title}" assigned successfully!` }
  } catch (e: any) {
    const error = createError(
      ErrorType.DB_WRITE_FAILED,
      e,
      { action: "sendProgramToClient", trainerId, clientId, programTitle: program.program_title },
      "Failed to assign program to client.",
    )
    logError(error)
    return { success: false, message: "Failed to assign program. Please try again.", error }
  }
}
