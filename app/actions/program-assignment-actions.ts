"use server"

import { assignProgramToClientService } from "@/lib/firebase/program-assignment-service"

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
