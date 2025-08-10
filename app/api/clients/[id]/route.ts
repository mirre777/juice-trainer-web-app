import { type NextRequest, NextResponse } from "next/server"
import { getClient } from "@/lib/firebase/client-service"
import { cookies } from "next/headers"
import { Client } from "@/types"
import { getTrainerIdFromCookie } from "@/lib/utils/user"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: clientId } = await params
    const trainerId = await getTrainerIdFromCookie()

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

// Allow to update customer
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const updatedClient = request.body as Partial<Client>
  const { id: clientId } = await params
  const cookieStore = await cookies()
  // Get trainer ID from header or cookie
  const userId = cookieStore.get("user_id")?.value
  const userIdAlt = cookieStore.get("userId")?.value // Fallback for inconsistent naming
  const trainerId = userId || userIdAlt
  console.log("API Route - Trainer ID:", trainerId)
  console.log("API Route - Client ID:", clientId)

    if (!trainerId) {
      return NextResponse.json({ error: "Unauthorized - Trainer ID not found" }, { status: 401 })
    }

    const client = await getClient(trainerId, clientId)

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }



}
