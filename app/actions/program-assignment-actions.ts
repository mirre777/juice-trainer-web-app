"use server"

import { assignProgramToClientService } from "@/lib/firebase/program-assignment-service"
import type { WorkoutProgram } from "@/types/workout-program"
import { getFirebaseAdminAuth, initializeFirebaseAdmin } from "@/lib/firebase/firebase-admin"
import { cookies } from "next/headers"

// Initialize Firebase Admin SDK if not already done
initializeFirebaseAdmin()

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

    const result = await assignProgramToClientService(programData, clientId, trainerId)

    if (result.success) {
      return { success: true, message: "Program successfully assigned to client!", data: result.data }
    } else {
      console.error("Failed to assign program:", result.error)
      return { success: false, message: result.error || "Failed to assign program to client." }
    }
  } catch (error: any) {
    console.error("Error in sendProgramToClient Server Action:", error)
    if (error.code === "auth/session-cookie-expired") {
      return { success: false, message: "Your session has expired. Please log in again." }
    }
    return { success: false, message: error.message || "An unexpected error occurred during program assignment." }
  }
}

export async function assignProgramToClient(programData: any, clientId: string, trainerId: string) {
  try {
    console.log("[Server Action] Assigning program to client:", { clientId, trainerId })

    const result = await assignProgramToClientService(programData, clientId, trainerId)

    if (result.success) {
      return {
        success: true,
        message: "Program assigned successfully",
        data: result.data,
      }
    } else {
      return {
        success: false,
        message: result.error || "Failed to assign program",
      }
    }
  } catch (error) {
    console.error("[Server Action] Error assigning program:", error)
    return {
      success: false,
      message: "An error occurred while assigning the program",
    }
  }
}
