import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchClients } from "@/lib/firebase/client-service"

export async function GET(request: NextRequest) {
  try {
    // Get trainer ID from session cookie
    const cookieStore = cookies()
    const trainerId = cookieStore.get("user_id")?.value

    if (!trainerId) {
      return NextResponse.json({ error: "Unauthorized - No trainer ID found" }, { status: 401 })
    }

    console.log("[API] Fetching clients for trainer:", trainerId)

    // Fetch clients from Firebase
    const clients = await fetchClients(trainerId)

    console.log("[API] Found clients:", clients.length)

    return NextResponse.json({ clients })
  } catch (error) {
    console.error("[API] Error fetching clients:", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}
