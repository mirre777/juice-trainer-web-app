import { type NextRequest, NextResponse } from "next/server"
import { fetchClients } from "@/lib/firebase/client-service"
import { getCurrentUserFromCookies } from "@/lib/auth/token-service"

export async function GET(request: NextRequest) {
  try {
    console.log("🚀 [GET /api/clients] Starting request")

    // Get current user from cookies/session
    const currentUser = await getCurrentUserFromCookies()

    if (!currentUser) {
      console.log("❌ [GET /api/clients] No authenticated user")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("👤 [GET /api/clients] Authenticated user:", {
      uid: currentUser.uid,
      email: currentUser.email,
      role: currentUser.role,
    })

    // Fetch clients using the service
    const clients = await fetchClients(currentUser.uid)

    console.log("📊 [GET /api/clients] Found clients:", clients.length)

    return NextResponse.json({
      clients,
      count: clients.length,
      userId: currentUser.uid,
    })
  } catch (error) {
    console.error("❌ [GET /api/clients] Error:", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}
