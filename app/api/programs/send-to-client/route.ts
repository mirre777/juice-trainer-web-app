import { type NextRequest, NextResponse } from "next/server"
import { programConversionService } from "@/lib/firebase/program-conversion-service"
import { getCurrentUser } from "@/lib/auth/auth-service"

export async function POST(request: NextRequest) {
  try {
    console.log("[send-to-client] API endpoint called")

    // Get current user (trainer)
    const user = await getCurrentUser()
    if (!user) {
      console.log("[send-to-client] Unauthorized - no user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const trainerId = user.uid
    console.log(`[send-to-client] Trainer ID: ${trainerId}`)

    const body = await request.json()
    const { programData, clientId, message } = body

    console.log(`[send-to-client] Request body:`, {
      programTitle: programData?.program_title,
      clientId,
      hasMessage: !!message,
    })

    // Validate required fields
    if (!programData) {
      return NextResponse.json({ error: "Program data is required" }, { status: 400 })
    }

    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 })
    }

    // Get the client's actual user ID
    const clientUserId = await programConversionService.getClientUserId(trainerId, clientId)

    if (!clientUserId) {
      console.log(`[send-to-client] Client not found or not linked: ${clientId}`)
      return NextResponse.json(
        { error: "Client not found or client does not have a linked user account" },
        { status: 404 },
      )
    }

    console.log(`[send-to-client] Client user ID: ${clientUserId}`)

    // Convert and send the program
    const programId = await programConversionService.convertAndSendProgram(programData, clientUserId)

    console.log(`[send-to-client] ✅ Program sent successfully. Program ID: ${programId}`)

    // TODO: Send notification to client (email/push notification)
    // if (message) {
    //   await notificationService.sendProgramNotification(clientUserId, programData.program_title, message)
    // }

    return NextResponse.json({
      success: true,
      programId,
      message: "Program sent successfully to client",
    })
  } catch (error) {
    console.error("[send-to-client] Error:", error)
    return NextResponse.json({ error: "Failed to send program to client", details: error.message }, { status: 500 })
  }
}
