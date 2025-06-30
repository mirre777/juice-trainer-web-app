import { type NextRequest, NextResponse } from "next/server"
import { programConversionService } from "@/lib/firebase/program-conversion-service"
import { getCurrentUser } from "@/lib/auth/auth-service"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { programData, clientId } = body

    if (!programData || !clientId) {
      return NextResponse.json({ error: "Program data and client ID are required" }, { status: 400 })
    }

    // Get the client's actual user ID
    const clientUserId = await programConversionService.getClientUserId(user.uid, clientId)
    if (!clientUserId) {
      return NextResponse.json({ error: "Client not found or not linked to a user account" }, { status: 404 })
    }

    // Convert and send the program
    const programId = await programConversionService.convertAndSendProgram(programData, clientUserId)

    return NextResponse.json({
      success: true,
      programId,
      message: "Program successfully sent to client",
    })
  } catch (error) {
    console.error("Error sending program to client:", error)
    return NextResponse.json({ error: "Failed to send program to client" }, { status: 500 })
  }
}
