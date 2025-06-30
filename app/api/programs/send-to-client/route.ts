import { type NextRequest, NextResponse } from "next/server"
import { programConversionService } from "@/lib/firebase/program-conversion-service"
import { getCurrentUser } from "@/lib/auth/auth-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { programData, clientId, message } = body

    if (!programData) {
      return NextResponse.json({ error: "Program data is required" }, { status: 400 })
    }

    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 })
    }

    // Get the current user (trainer) ID from session/auth
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const trainerId = user.uid // Replace with actual trainer ID from auth

    // Get the client's user ID
    const clientUserId = await programConversionService.getClientUserId(trainerId, clientId)

    if (!clientUserId) {
      return NextResponse.json({ error: "Client not found or not linked" }, { status: 404 })
    }

    // Convert and send the program
    const programId = await programConversionService.convertAndSendProgram(programData, clientUserId)

    // TODO: Send notification to client (email/push notification)
    // await notificationService.sendProgramNotification(clientUserId, programData.title, message)

    return NextResponse.json({
      success: true,
      programId,
      message: "Program sent successfully to client",
    })
  } catch (error) {
    console.error("Error sending program to client:", error)
    return NextResponse.json({ error: "Failed to send program to client" }, { status: 500 })
  }
}
