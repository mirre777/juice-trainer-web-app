import { type NextRequest, NextResponse } from "next/server"
import { getCookie } from "cookies-next"
import { subscribeToClients } from "@/lib/firebase/client-service"

export async function GET(request: NextRequest) {
  try {
    console.log("[API] /api/clients - Starting request")

    // Get user ID from cookies (same method as other working routes)
    const userId = getCookie("user_id", { req: request }) || getCookie("userId", { req: request })

    if (!userId) {
      console.log("[API] /api/clients - No user ID found in cookies")
      return NextResponse.json({ success: false, error: "No authentication token" }, { status: 401 })
    }

    console.log("[API] /api/clients - User ID found:", userId)

    // Get all clients for this trainer - NO FILTERING
    return new Promise((resolve) => {
      const unsubscribe = subscribeToClients(userId as string, (clients, error) => {
        unsubscribe() // Clean up the subscription immediately

        if (error) {
          console.error("[API] /api/clients - Error fetching clients:", error)
          resolve(NextResponse.json({ success: false, error: error.message }, { status: 500 }))
          return
        }

        console.log(`[API] /api/clients - Successfully fetched ${clients.length} clients`)

        // Return ALL clients without any filtering
        resolve(
          NextResponse.json({
            success: true,
            clients: clients,
            clientCount: clients.length,
            totalClients: clients.length,
          }),
        )
      })
    })
  } catch (error) {
    console.error("[API] /api/clients - Unexpected error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
