export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { cookies } from "next/headers"

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

    // Use the fixed client service
    const { fetchClients } = await import("@/lib/firebase/client-service-fixed")
    const clients = await fetchClients(userId)

    console.log("✅ [API] Clients fetched successfully:", clients.length, "clients")

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
