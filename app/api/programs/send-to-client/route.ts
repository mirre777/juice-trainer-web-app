import { type NextRequest, NextResponse } from "next/server"
import { programConversionService } from "@/lib/firebase/program-conversion-service"

export async function POST(request: NextRequest) {
  try {
    console.log("📨 Received POST request to send program to client")

    const body = await request.json()
    console.log("📋 Request body:", body)

    const { clientId, programData, customMessage } = body

    if (!clientId) {
      console.error("❌ Missing clientId in request")
      return NextResponse.json({ success: false, error: "Client ID is required" }, { status: 400 })
    }

    if (!programData) {
      console.error("❌ Missing programData in request")
      return NextResponse.json({ success: false, error: "Program data is required" }, { status: 400 })
    }

    console.log("🔄 Calling program conversion service...")
    const result = await programConversionService.sendProgramToClient(clientId, programData)

    console.log("✅ Program conversion successful:", result)

    return NextResponse.json({
      success: true,
      message: "Program sent to client successfully",
      data: result,
    })
  } catch (error) {
    console.error("❌ Error in send-to-client API:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
