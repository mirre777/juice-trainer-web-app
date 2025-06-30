import { NextResponse } from "next/server"
import { convertAndSendProgramToClient, getClientUserId } from "@/lib/firebase/program-conversion-service"
import type { WorkoutProgram } from "@/types/workout-program"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { program, trainerId, clientId, message } = body

    console.log(`[send-to-client] Received request to send program to client: ${clientId}`)

    // Validate required fields
    if (!program || !trainerId || !clientId) {
      return NextResponse.json({ message: "Program, trainer ID, and client ID are required" }, { status: 400 })
    }

    // Validate program structure
    if (!program.program_title || !program.program_weeks) {
      return NextResponse.json({ message: "Invalid program structure - missing title or weeks" }, { status: 400 })
    }

    // Get the client's user ID
    const clientUserId = await getClientUserId(trainerId, clientId)
    if (!clientUserId) {
      return NextResponse.json(
        { message: "Client user ID not found - client may not have created an account yet" },
        { status: 404 },
      )
    }

    console.log(`[send-to-client] Converting program for client user ID: ${clientUserId}`)

    // Convert and send the program
    const result = await convertAndSendProgramToClient(program as WorkoutProgram, clientUserId, message)

    if (!result.success) {
      console.error("[send-to-client] Failed to convert and send program:", result.error)
      return NextResponse.json({ message: "Failed to send program to client", error: result.error }, { status: 500 })
    }

    console.log(`[send-to-client] Successfully sent program: ${result.programId}`)

    return NextResponse.json({
      message: "Program sent to client successfully",
      programId: result.programId,
    })
  } catch (error) {
    console.error("[send-to-client] Unexpected error:", error)
    return NextResponse.json({ message: "Internal server error", error: error.message }, { status: 500 })
  }
}
