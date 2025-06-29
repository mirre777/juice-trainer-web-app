"use server"

import { assignProgramToClientService } from "@/lib/firebase/program-assignment-service"
import { cookies } from "next/headers"
import type { Client } from "@/types/client"

export async function assignProgramToClient(
  client: Client,
  programData: any,
): Promise<{ success: boolean; message: string }> {
  try {
    const cookieStore = cookies()
    const trainerId = cookieStore.get("user_id")?.value

    if (!trainerId) {
      return {
        success: false,
        message: "Authentication required",
      }
    }

    await assignProgramToClientService(trainerId, client, programData)

    return {
      success: true,
      message: `Program assigned to ${client.name} successfully!`,
    }
  } catch (error) {
    console.error("Error in assignProgramToClient action:", error)
    return {
      success: false,
      message: "Failed to assign program. Please try again.",
    }
  }
}

export async function assignProgramToMultipleClients(
  clients: Client[],
  programData: any,
): Promise<{ success: boolean; message: string; results: Array<{ clientName: string; success: boolean }> }> {
  try {
    const cookieStore = cookies()
    const trainerId = cookieStore.get("user_id")?.value

    if (!trainerId) {
      return {
        success: false,
        message: "Authentication required",
        results: [],
      }
    }

    const results = await Promise.allSettled(
      clients.map((client) => assignProgramToClientService(trainerId, client, programData)),
    )

    const clientResults = results.map((result, index) => ({
      clientName: clients[index].name,
      success: result.status === "fulfilled",
    }))

    const successCount = clientResults.filter((r) => r.success).length
    const totalCount = clients.length

    return {
      success: successCount > 0,
      message: `Successfully assigned program to ${successCount}/${totalCount} clients`,
      results: clientResults,
    }
  } catch (error) {
    console.error("Error in assignProgramToMultipleClients action:", error)
    return {
      success: false,
      message: "Failed to assign programs. Please try again.",
      results: [],
    }
  }
}
