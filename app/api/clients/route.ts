import { type NextRequest, NextResponse } from "next/server"
import { fetchClients } from "@/lib/firebase/client-service"
import { getTrainerIdFromCookie } from "@/lib/utils/user"

export async function GET(_: NextRequest) {
  console.log("[API /api/clients] === REQUEST RECEIVED ===")

  try {
    // Use the SAME authentication method as your existing working routes
    const trainerId = await getTrainerIdFromCookie()

    console.log("🔍 [API /api/clients] Auth check:", trainerId)

    if (!trainerId) {
      console.log("❌ [API /api/clients] No trainer ID found in cookies")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    console.log("✅ [API /api/clients] Authenticated trainer:", trainerId)

    // Use your existing fetchClients function - NO server-side filtering
    console.log("📊 [API /api/clients] Calling fetchClients...")
    const allClients = await fetchClients(trainerId)
    console.log("[API /api/clients] Raw clients from fetchClients:", allClients.length)

    // Return ALL clients - no filtering
    console.log("[API /api/clients] Returning ALL clients without any filtering")

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
