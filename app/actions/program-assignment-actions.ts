"use server"

import { assignProgramToClientService } from "@/lib/firebase/program-assignment-service"
import type { AppError } from "@/lib/utils/error-handler"

export async function assignProgramToClient(
  programId: string,
  clientId: string,
  trainerId: string,
  programData: any,
): Promise<{ success: boolean; error?: AppError; assignmentId?: string }> {
  return await assignProgramToClientService(programId, clientId, trainerId, programData)
}

export async function assignProgramToMultipleClients(
  programId: string,
  clientIds: string[],
  trainerId: string,
  programData: any,
): Promise<{
  success: boolean
  results: Array<{ clientId: string; success: boolean; error?: AppError; assignmentId?: string }>
}> {
  const results = await Promise.all(
    clientIds.map(async (clientId) => {
      const result = await assignProgramToClientService(programId, clientId, trainerId, programData)
      return {
        clientId,
        ...result,
      }
    }),
  )

  const allSuccessful = results.every((result) => result.success)

  return {
    success: allSuccessful,
    results,
  }
}
