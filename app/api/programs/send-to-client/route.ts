export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { convertAndSendProgramToClient } from "@/lib/firebase/program-conversion-service"
import { getTokenFromServer } from "@/lib/auth/token-service"
import type { WorkoutProgram } from "@/types/workout-program"

export async function POST(request: Request) {
  try {
    // Verify authentication
    const token = await getTokenFromServer()
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { trainerId, clientId, program, message } = body

    if (!trainerId || !clientId || !program) {
      return NextResponse.json({ message: "Trainer ID, client ID, and program are required" }, { status: 400 })
    }

    console.log(`[API] Sending program to client: ${clientId}`)

    const result = await convertAndSendProgramToClient(trainerId, clientId, program as WorkoutProgram, message)

    if (!result.success) {
      console.error("[API] Failed to send program:", result.error)
      return NextResponse.json({ message: "Failed to send program to client", error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      message: "Program successfully sent to client",
      success: true,
    })
  } catch (error) {
    console.error("[API] Error in send-to-client endpoint:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
