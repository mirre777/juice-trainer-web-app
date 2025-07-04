import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/firebase/user-service"

export async function GET(request: NextRequest) {
  console.log("[API /api/clients] === REQUEST RECEIVED ===")

  try {
    // Use the same getCurrentUser function that works elsewhere
    console.log("[API /api/clients] Getting current user...")
    const currentUser = await getCurrentUser()
    console.log("[API /api/clients] Current user:", {
      exists: !!currentUser,
      uid: currentUser?.uid,
      email: currentUser?.email,
      name: currentUser?.name,
    })

    if (!currentUser) {
      console.log("[API /api/clients] ❌ No current user found")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    console.log("[API /api/clients] Fetching clients for trainer:", currentUser.uid)

    // Import and use your existing fetchClients function
    const { fetchClients } = await import("@/lib/firebase/client-service")
    const clients = await fetchClients(currentUser.uid)
    console.log("[API /api/clients] Raw clients from fetchClients:", clients.length)

    // Filter clients to only include those with linked accounts and active status
    const activeLinkedClients = clients.filter((client) => {
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

    console.log("[API /api/clients] Filtered active linked clients:", activeLinkedClients.length)
    console.log(
      "[API /api/clients] Active linked clients:",
      activeLinkedClients.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        status: c.status,
        userId: c.userId,
      })),
    )

    return NextResponse.json({
      success: true,
      clients: activeLinkedClients,
      totalClients: clients.length,
      activeLinkedClients: activeLinkedClients.length,
    })
  } catch (error) {
    console.error("[API /api/clients] ❌ Error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch clients" }, { status: 500 })
  }
}
