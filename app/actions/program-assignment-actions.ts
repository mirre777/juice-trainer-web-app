"use server"

import { assignProgramToClientService } from "@/lib/firebase/program-assignment-service"
import { cookies } from "next/headers"
import { getFirebaseAdminAuth } from "@/lib/firebase/firebase-admin"

export async function assignProgramToClient(
  clientId: string,
  programData: {
    id: string
    name: string
    weeks: any[]
  },
  notes?: string,
) {
  try {
    // Get the session cookie
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get("session")?.value

    if (!sessionCookie) {
      throw new Error("No session found")
    }

    // Verify the session cookie
    const auth = getFirebaseAdminAuth()
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true)
    const trainerId = decodedClaims.uid

    // Assign the program to the client
    const assignmentId = await assignProgramToClientService(trainerId, clientId, programData, notes)

    return {
      success: true,
      assignmentId,
      message: "Program assigned successfully",
    }
  } catch (error) {
    console.error("Error in assignProgramToClient action:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to assign program",
    }
  }
}

export async function getProgramAssignments(clientId?: string) {
  try {
    // Get the session cookie
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get("session")?.value

    if (!sessionCookie) {
      throw new Error("No session found")
    }

    // Verify the session cookie
    const auth = getFirebaseAdminAuth()
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true)
    const trainerId = decodedClaims.uid

    // This would fetch assignments from the database
    // For now, return empty array
    return {
      success: true,
      assignments: [],
    }
  } catch (error) {
    console.error("Error in getProgramAssignments action:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get assignments",
    }
  }
}
