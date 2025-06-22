"use server"

import { assignProgramToClient } from "@/lib/firebase/program-assignment-service"
import type { WorkoutProgram } from "@/types/workout-program"
import { getFirebaseAdminAuth, initializeFirebaseAdmin } from "@/lib/firebase/firebase-admin"
import { cookies } from "next/headers"

// Initialize Firebase Admin SDK if not already done
initializeFirebaseAdmin()

/**
 * Server Action to send a program to a specific client.
 * @param programData The WorkoutProgram object (from the trainer's imported program).
 * @param clientId The document ID of the client under the trainer's 'clients' subcollection.
 * @returns A success or error message.
 */
export async function sendProgramToClient(programData: WorkoutProgram, clientId: string) {
  try {
    const sessionCookie = cookies().get("session")?.value

    if (!sessionCookie) {
      return { success: false, message: "Unauthorized: No session found." }
    }

    // Verify the session cookie to get the trainer's UID
    const decodedClaims = await getFirebaseAdminAuth().verifySessionCookie(sessionCookie, true)
    const trainerId = decodedClaims.uid

    if (!trainerId) {
      return { success: false, message: "Unauthorized: Trainer ID not found in session." }
    }

    console.log(`[Server Action] Trainer ${trainerId} attempting to assign program to client ${clientId}`)

    const result = await assignProgramToClient(trainerId, clientId, programData)

    if (result.success) {
      return { success: true, message: "Program successfully assigned to client!", programId: result.programId }
    } else {
      console.error("Failed to assign program:", result.error)
      return { success: false, message: result.error?.message || "Failed to assign program to client." }
    }
  } catch (error: any) {
    console.error("Error in sendProgramToClient Server Action:", error)
    // Handle specific Firebase Admin SDK errors if needed, e.g., session cookie expired
    if (error.code === "auth/session-cookie-expired") {
      return { success: false, message: "Your session has expired. Please log in again." }
    }
    return { success: false, message: error.message || "An unexpected error occurred during program assignment." }
  }
}
