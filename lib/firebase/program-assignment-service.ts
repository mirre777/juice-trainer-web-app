import { getFirebaseAdminFirestore } from "./firebase-admin"
import { type AppError, ErrorType, createError, logError } from "@/lib/utils/error-handler"

export interface ProgramAssignment {
  id?: string
  programId: string
  clientId: string
  trainerId: string
  assignedAt: Date
  status: "active" | "completed" | "paused"
  programData?: any
}

export async function assignProgramToClientService(
  programId: string,
  clientId: string,
  trainerId: string,
  programData: any,
): Promise<{ success: boolean; error?: AppError; assignmentId?: string }> {
  try {
    const db = getFirebaseAdminFirestore()

    const assignment: ProgramAssignment = {
      programId,
      clientId,
      trainerId,
      assignedAt: new Date(),
      status: "active",
      programData,
    }

    const docRef = await db.collection("users").doc(trainerId).collection("program_assignments").add(assignment)

    console.log(`Program ${programId} assigned to client ${clientId} with assignment ID: ${docRef.id}`)

    return {
      success: true,
      assignmentId: docRef.id,
    }
  } catch (error) {
    const appError = createError(
      ErrorType.DB_WRITE_FAILED,
      error,
      { programId, clientId, trainerId },
      "Failed to assign program to client",
    )

    logError(appError)

    return {
      success: false,
      error: appError,
    }
  }
}
