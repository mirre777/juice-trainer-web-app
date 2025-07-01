import { type NextRequest, NextResponse } from "next/server"
import { getClientsForTrainer } from "@/lib/firebase/client-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const trainerId = searchParams.get("trainerId")

    console.log("[API /clients] Request received with trainerId:", trainerId)

    if (!trainerId) {
      console.log("[API /clients] No trainerId provided")
      return NextResponse.json({ success: false, error: "Trainer ID is required" }, { status: 400 })
    }

    console.log("[API /clients] Calling getClientsForTrainer...")
    const clients = await getClientsForTrainer(trainerId)
    console.log("[API /clients] Raw clients from service:", clients?.length || 0, "clients")
    console.log("[API /clients] First few clients:", clients?.slice(0, 3))

    // Filter for active clients with linked accounts
    const activeLinkedClients =
      clients?.filter((client) => {
        const hasLinkedAccount = client.hasFirebaseAuth === true
        const isActive = client.status !== "archived" && client.status !== "deleted"
        console.log(
          `[API /clients] Client ${client.name}: hasFirebaseAuth=${client.hasFirebaseAuth}, status=${client.status}, included=${hasLinkedAccount && isActive}`,
        )
        return hasLinkedAccount && isActive
      }) || []

    console.log("[API /clients] Filtered active linked clients:", activeLinkedClients.length)

    return NextResponse.json({
      success: true,
      clients: activeLinkedClients,
      totalClients: clients?.length || 0,
      activeLinkedClients: activeLinkedClients.length,
    })
  } catch (error) {
    console.error("[API /clients] Error fetching clients:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch clients" }, { status: 500 })
  }
}
