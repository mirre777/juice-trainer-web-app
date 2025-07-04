import { type NextRequest, NextResponse } from "next/server"
import { programConversionService } from "@/lib/firebase/program-conversion-service"

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 API: Starting program send to client...")

    const body = await request.json()
    console.log("📝 API: Request body:", JSON.stringify(body, null, 2))

    const { clientId, programData, customMessage } = body

    if (!clientId) {
      console.error("❌ API: Missing clientId")
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 })
    }

    if (!programData) {
      console.error("❌ API: Missing programData")
      return NextResponse.json({ error: "Program data is required" }, { status: 400 })
    }

    console.log("🔄 API: Calling program conversion service...")
    const result = await programConversionService.sendProgramToClient(clientId, programData, customMessage)

    console.log("✅ API: Program sent successfully:", result)
    return NextResponse.json({
      success: true,
      message: "Program sent successfully",
      data: result,
    })
  } catch (error) {
    console.error("❌ API: Error sending program to client:", error)
    return NextResponse.json(
      {
        error: "Failed to send program to client",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
