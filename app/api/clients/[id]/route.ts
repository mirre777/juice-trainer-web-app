import { type NextRequest, NextResponse } from "next/server"
import { getClient, updateClient } from "@/lib/firebase/client-service"
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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: clientId } = await params
    const trainerId = await getTrainerIdFromCookie()
    const body = await request.json()

    console.log("API Route - Update Client - Trainer ID:", trainerId)
    console.log("API Route - Update Client - Client ID:", clientId)
    console.log("API Route - Update Client - Body:", body)

    if (!trainerId) {
      return NextResponse.json({ error: "Unauthorized - Trainer ID not found" }, { status: 401 })
    }

    const { name, email, phone } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const result = await updateClient(trainerId, clientId, {
      name: name.trim(),
      email: email?.trim() || "",
      phone: phone?.trim() || "",
    })

    if (result.success) {
      return NextResponse.json({ success: true, message: "Client updated successfully" })
    } else {
      return NextResponse.json({ error: result.error || "Failed to update client" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error updating client:", error)
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 })
  }
}
