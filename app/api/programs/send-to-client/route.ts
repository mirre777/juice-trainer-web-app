import { NextResponse } from "next/server"
import { convertAndSendProgramToClient, getClientUserId } from "@/lib/firebase/program-conversion-service"
import type { WorkoutProgram } from "@/types/workout-program"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { program, clientId, trainerId, message } = body

    // Validate required fields
    if (!program || !clientId || !trainerId) {
      return NextResponse.json({ message: "Program, client ID, and trainer ID are required" }, { status: 400 })
    }

    // Validate program structure
    if (!program.program_title || !program.program_weeks) {
      return NextResponse.json({ message: "Program must have a title and weeks count" }, { status: 400 })
    }

    console.log(`[send-to-client] Sending program "${program.program_title}" to client: ${clientId}`)

    // Get the client's actual userId from the trainer's client document
    const clientUserId = await getClientUserId(trainerId, clientId)

    if (!clientUserId) {
      return NextResponse.json(
        { message: "Client not found or client does not have a linked user account" },
        { status: 404 },
      )
    }

    console.log(`[send-to-client] Found client userId: ${clientUserId}`)

    // Convert and send the program
    const result = await convertAndSendProgramToClient(program as WorkoutProgram, clientUserId, message)

    if (!result.success) {
      console.error("[send-to-client] Failed to send program:", result.error)
      return NextResponse.json({ message: "Failed to send program to client", error: result.error }, { status: 500 })
    }

    console.log(`[send-to-client] Successfully sent program. Program ID: ${result.programId}`)

    return NextResponse.json({
      success: true,
      programId: result.programId,
      message: "Program successfully sent to client",
    })
  } catch (error) {
    console.error("[send-to-client] Unexpected error:", error)
    return NextResponse.json({ message: "Internal server error", error: error.message }, { status: 500 })
  }
}
