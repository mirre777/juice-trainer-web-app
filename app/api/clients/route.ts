import { type NextRequest, NextResponse } from "next/server"
import { fetchClients } from "@/lib/firebase/client-service"

export async function GET(request: NextRequest) {
  try {
    // Get trainer ID from cookie
    const userIdCookie = request.cookies.get("user_id")
    const trainerId = userIdCookie?.value

    if (!trainerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[API] Fetching clients for trainer:", trainerId)

    // Fetch clients using the Firebase service
    const clients = await fetchClients(trainerId)

    console.log("[API] Found clients:", clients.length)

    // Map the client data to the expected format
    const mappedClients = clients.map((client) => ({
      id: client.id,
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      status: client.status || "Active",
      joinDate: client.createdAt ? new Date(client.createdAt.seconds * 1000).toISOString() : "",
      lastWorkout: client.lastWorkout?.name || "",
    }))

    return NextResponse.json(mappedClients)
  } catch (error) {
    console.error("[API] Error fetching clients:", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}
