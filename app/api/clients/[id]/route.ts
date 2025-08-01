import { type NextRequest, NextResponse } from "next/server"
import { getClient } from "@/lib/firebase/client-service"
import { cookies } from "next/headers"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clientId = params.id
    const cookieStore = await cookies()
    // Get trainer ID from header or cookie
    const trainerId = request.headers.get("trainer-id") || cookieStore.get("userId")?.value || ""

    console.log("API Route - Trainer ID:", trainerId)
    console.log("API Route - Client ID:", clientId)

    if (!trainerId) {
      return NextResponse.json({ error: "Unauthorized - Trainer ID not found" }, { status: 401 })
    }

    const client = await getClient(trainerId, clientId)

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error("Error fetching client:", error)
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 })
  }
}
