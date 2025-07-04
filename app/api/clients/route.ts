import { NextResponse } from "next/server"
import { UnifiedClientService } from "@/lib/services/unified-client-service"

export async function GET() {
  try {
    console.log("🚀 [API:clients] GET - Fetching clients")

    // Use unified client service to get clients
    const clientResult = await UnifiedClientService.getClients()

    if (!clientResult.success) {
      console.log("❌ [API:clients] Failed to fetch clients:", clientResult.error?.message)

      const statusCode = clientResult.error?.errorType === "AUTH_UNAUTHORIZED" ? 401 : 500
      return NextResponse.json(
        {
          error: clientResult.error?.message || "Failed to fetch clients",
          clients: [],
        },
        { status: statusCode },
      )
    }

    console.log(`✅ [API:clients] Successfully fetched ${clientResult.clients?.length || 0} clients`)

    return NextResponse.json({
      success: true,
      clients: clientResult.clients || [],
      count: clientResult.clients?.length || 0,
    })
  } catch (error: any) {
    console.error("💥 [API:clients] Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error?.message || "Unknown error",
        clients: [],
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    console.log("🚀 [API:clients] POST - Adding new client")

    const body = await request.json()
    const { name, email, phone, goal, program, notes } = body

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Client name is required" }, { status: 400 })
    }

    // Use unified client service to add client
    const clientResult = await UnifiedClientService.addClient({
      name: name.trim(),
      email: email?.trim() || "",
      phone: phone?.trim() || "",
      goal: goal?.trim() || "",
      program: program?.trim() || "",
      notes: notes?.trim() || "",
    })

    if (!clientResult.success) {
      console.log("❌ [API:clients] Failed to add client:", clientResult.error?.message)

      const statusCode = clientResult.error?.errorType === "AUTH_UNAUTHORIZED" ? 401 : 400
      return NextResponse.json(
        {
          error: clientResult.error?.message || "Failed to add client",
          success: false,
        },
        { status: statusCode },
      )
    }

    console.log(`✅ [API:clients] Successfully added client: ${clientResult.clientId}`)

    return NextResponse.json({
      success: true,
      clientId: clientResult.clientId,
      message: clientResult.message || "Client added successfully",
    })
  } catch (error: any) {
    console.error("💥 [API:clients] Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error?.message || "Unknown error",
        success: false,
      },
      { status: 500 },
    )
  }
}
