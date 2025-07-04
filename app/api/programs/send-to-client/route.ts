import { type NextRequest, NextResponse } from "next/server"
import { convertProgramToFirebaseFormat } from "@/lib/firebase/program-conversion-service"
import { clientService } from "@/lib/firebase/client-service"

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 API: Starting program send to client...")

    const body = await request.json()
    console.log("📝 API: Request body:", JSON.stringify(body, null, 2))

    const { clientId, programData, customMessage } = body

    if (!clientId || !programData) {
      console.error("❌ API: Missing required fields")
      return NextResponse.json({ error: "Missing clientId or programData" }, { status: 400 })
    }

    console.log("🔍 API: Getting client document...")
    const client = await clientService.getClient(clientId)

    if (!client) {
      console.error("❌ API: Client not found:", clientId)
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    console.log("✅ API: Client found:", client.name)
    console.log("🔗 API: Client userId:", client.userId)

    if (!client.userId) {
      console.error("❌ API: Client has no linked user account")
      return NextResponse.json(
        { error: "Client not found or client does not have a linked user account" },
        { status: 404 },
      )
    }

    console.log("🔄 API: Converting program to Firebase format...")
    const result = await convertProgramToFirebaseFormat(
      programData,
      client.userId,
      customMessage || `Program sent from trainer`,
    )

    console.log("✅ API: Program conversion successful")
    console.log("📊 API: Result:", {
      programId: result.programId,
      routineIds: result.routineIds,
      userId: client.userId,
    })

    return NextResponse.json({
      success: true,
      message: `Program successfully sent to ${client.name}`,
      programId: result.programId,
      routineIds: result.routineIds,
    })
  } catch (error) {
    console.error("💥 API: Error sending program to client:", error)
    return NextResponse.json(
      {
        error: "Failed to send program to client",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
