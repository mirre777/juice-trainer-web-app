import { type NextRequest, NextResponse } from "next/server"
import { fetchClients } from "@/lib/firebase/client-service"
import { verifyToken } from "@/lib/auth/token-service"

export async function GET(request: NextRequest) {
  console.log("[API /api/clients] === REQUEST RECEIVED ===")

  try {
    // Get auth token from Authorization header
    const authHeader = request.headers.get("authorization")
    console.log("[API /api/clients] Auth header:", authHeader ? "Present" : "Missing")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("[API /api/clients] ❌ No valid Authorization header")
      return NextResponse.json({ success: false, error: "Authorization header required" }, { status: 401 })
    }

    const token = authHeader.substring(7) // Remove "Bearer " prefix
    console.log("[API /api/clients] Token extracted, length:", token.length)

    // Verify the token
    const tokenData = await verifyToken(token)
    if (!tokenData || !tokenData.uid) {
      console.log("[API /api/clients] ❌ Invalid or expired token")
      return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 })
    }

    console.log("[API /api/clients] ✅ Token verified for user:", {
      uid: tokenData.uid,
      email: tokenData.email,
      role: tokenData.role,
    })

    console.log("[API /api/clients] Fetching clients for trainer:", tokenData.uid)

    // Fetch clients for the trainer
    const clients = await fetchClients(tokenData.uid)
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
