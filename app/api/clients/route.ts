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

    // Filter clients to only include those with linked accounts and active status
    const activeLinkedClients = allClients.filter((client) => {
      const hasUserId = !!client.userId
      const isActive = client.status === "Active"
      const hasLinkedAccount = client.hasLinkedAccount

      console.log(`[API /api/clients] Client ${client.name}:`, {
        id: client.id,
        userId: client.userId || "NO_USER_ID",
        status: client.status,
        hasLinkedAccount,
        hasUserId,
        isActive,
        willInclude: hasUserId && isActive && hasLinkedAccount,
      })

      return hasUserId && isActive && hasLinkedAccount
    })

    console.log("[API /api/clients] ✅ Results:", {
      totalClients: allClients.length,
      activeLinkedClients: activeLinkedClients.length,
    })

    return NextResponse.json({
      success: true,
      clients: activeLinkedClients,
      totalClients: allClients.length,
      activeLinkedClients: activeLinkedClients.length,
    })
  } catch (error) {
    console.error("[API /api/clients] ❌ Error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch clients" }, { status: 500 })
  }
}
