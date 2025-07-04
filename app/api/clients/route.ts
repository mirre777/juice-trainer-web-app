import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchClients } from "@/lib/firebase/client-service"

export async function GET(request: NextRequest) {
  console.log("[API /api/clients] === REQUEST RECEIVED ===")

  try {
    // Use the same authentication method as your existing working routes
    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value
    const userIdAlt = cookieStore.get("userId")?.value // Fallback for inconsistent naming
    const trainerId = userId || userIdAlt

    console.log("🔍 [API /api/clients] Auth check:", {
      userId,
      userIdAlt,
      trainerId,
      hasCookies: !!cookieStore,
    })

    if (!trainerId) {
      console.log("❌ [API /api/clients] No trainer ID found in cookies")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    console.log("✅ [API /api/clients] Authenticated trainer:", trainerId)

    // Use your existing fetchClients function
    console.log("📊 [API /api/clients] Calling fetchClients...")
    const allClients = await fetchClients(trainerId)
    console.log("[API /api/clients] Raw clients from fetchClients:", allClients.length)

    // Get all clients - no server-side filtering
    console.log("[API /api/clients] Returning ALL clients without filtering")

    return NextResponse.json({
      success: true,
      clients: allClients,
      totalClients: allClients.length,
    })
  } catch (error) {
    console.error("[API /api/clients] ❌ Error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch clients" }, { status: 500 })
  }
}
