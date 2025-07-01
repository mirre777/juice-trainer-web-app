import { type NextRequest, NextResponse } from "next/server"
import { fetchClients } from "@/lib/firebase/client-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const trainerId = searchParams.get("trainerId")

    console.log("[API /clients] Request received with trainerId:", trainerId)

    if (!trainerId) {
      console.log("[API /clients] No trainerId provided")
      return NextResponse.json({ success: false, error: "Trainer ID is required" }, { status: 400 })
    }

    console.log("[API /clients] Calling fetchClients...")
    const result = await fetchClients(trainerId)
    console.log("[API /clients] fetchClients result:", result)

    if (!result.success) {
      console.log("[API /clients] fetchClients failed:", result.error)
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    const clients = result.clients || []
    console.log("[API /clients] Raw clients from service:", clients.length, "clients")
    console.log("[API /clients] First few clients:", clients.slice(0, 3))

    // Filter for active clients - more lenient filtering
    const activeClients = clients.filter((client) => {
      // Include clients that are active and not deleted/archived
      const isActive =
        client.status !== "archived" &&
        client.status !== "deleted" &&
        client.status !== "Deleted" &&
        client.status !== "Archived"

      console.log(
        `[API /clients] Client ${client.name}: status=${client.status}, userId=${client.userId}, included=${isActive}`,
      )
      return isActive
    })

    console.log("[API /clients] Filtered active clients:", activeClients.length)

    return NextResponse.json({
      success: true,
      clients: activeClients,
      totalClients: clients.length,
      activeClients: activeClients.length,
    })
  } catch (error) {
    console.error("[API /clients] Error fetching clients:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch clients" }, { status: 500 })
  }
}
