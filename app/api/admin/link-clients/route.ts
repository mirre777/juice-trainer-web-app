import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/auth-service"
import { clientLinkingService } from "@/lib/firebase/client-linking-service"

export async function POST(request: NextRequest) {
  try {
    console.log("[link-clients] API endpoint called")

    // Get current user (trainer)
    const user = await getCurrentUser()
    if (!user) {
      console.log("[link-clients] Unauthorized - no user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const trainerId = user.uid
    console.log(`[link-clients] Processing for trainer: ${trainerId}`)

    const body = await request.json()
    const { action, clientId, userId } = body

    if (action === "link-specific" && clientId && userId) {
      // Link specific client
      const result = await clientLinkingService.linkSpecificClient(trainerId, clientId, userId)
      return NextResponse.json(result)
    } else if (action === "link-all") {
      // Link all clients for this trainer
      const result = await clientLinkingService.linkClientsWithUsers(trainerId)
      return NextResponse.json(result)
    } else if (action === "status") {
      // Get linking status
      const result = await clientLinkingService.getLinkingStatus(trainerId)
      return NextResponse.json(result)
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("[link-clients] Error:", error)
    return NextResponse.json({ error: "Failed to process client linking", details: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get current user (trainer)
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const trainerId = user.uid

    // Get linking status
    const result = await clientLinkingService.getLinkingStatus(trainerId)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[link-clients] Error getting status:", error)
    return NextResponse.json({ error: "Failed to get linking status", details: error.message }, { status: 500 })
  }
}
