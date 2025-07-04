import { type NextRequest, NextResponse } from "next/server"
import { programConversionService } from "@/lib/firebase/program-conversion-service"

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 API Route: /api/programs/send-to-client called")

    const body = await request.json()
    console.log("📝 Request body:", JSON.stringify(body, null, 2))

    const { clientId, programData, customMessage } = body

    // Validate required fields
    if (!clientId) {
      console.error("❌ Missing clientId")
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 })
    }

    if (!programData) {
      console.error("❌ Missing programData")
      return NextResponse.json({ error: "Program data is required" }, { status: 400 })
    }

    console.log("✅ Validation passed, calling program conversion service...")
    console.log("🎯 Client ID:", clientId)
    console.log("📊 Program name:", programData.name)
    console.log("📅 Duration:", programData.duration_weeks, "weeks")
    console.log("🏋️ Routines count:", programData.routines?.length || 0)

    // Call the program conversion service
    const result = await programConversionService.sendProgramToClient(clientId, programData, customMessage)

    console.log("✅ Program conversion service completed successfully")
    console.log("📋 Result:", JSON.stringify(result, null, 2))

    return NextResponse.json({
      success: true,
      message: "Program sent to client successfully",
      data: result,
    })
  } catch (error) {
    console.error("❌ Error in /api/programs/send-to-client:", error)
    console.error("📍 Error stack:", error instanceof Error ? error.stack : "No stack trace")

    return NextResponse.json(
      {
        error: "Failed to send program to client",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
