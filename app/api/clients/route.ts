export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchClients } from "@/lib/firebase/client-service"

export async function GET() {
  try {
    console.log("🚀 [API] Starting /api/clients request")

    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value
    console.log("🆔 [API] User ID from cookie:", userId)

    if (!userId) {
      console.log("❌ [API] No user_id in cookies")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log("📊 [API] Fetching clients for trainer:", userId)

    // Use the client service to fetch clients
    const clients = await fetchClients(userId)

    console.log("✅ [API] Clients fetched successfully:", clients.length, "clients")
    console.log("📤 [API] Sending clients response:", clients)

    return NextResponse.json({
      success: true,
      clients: clients,
      count: clients.length,
    })
  } catch (error: any) {
    console.error("💥 [API] Unexpected error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    console.log("🚀 [API] Starting POST /api/clients request")

    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value

    if (!userId) {
      console.log("❌ [API] No user_id in cookies")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    console.log("📝 [API] Request body:", body)

    const { name, email, phone, goal, notes, program } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Import the createClient function
    const { createClient } = await import("@/lib/firebase/client-service")

    const result = await createClient(userId, {
      name,
      email: email || "",
      phone: phone || "",
      goal: goal || "",
      notes: notes || "",
      program: program || "",
    })

    if (result.success) {
      console.log("✅ [API] Client created successfully:", result.clientId)
      return NextResponse.json({
        success: true,
        clientId: result.clientId,
        message: "Client created successfully",
      })
    } else {
      console.error("❌ [API] Failed to create client:", result.error)
      return NextResponse.json(
        {
          success: false,
          error: result.error?.message || "Failed to create client",
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("💥 [API] Error creating client:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}
