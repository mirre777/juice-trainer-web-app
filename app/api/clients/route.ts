import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchClients } from "@/lib/firebase/client-service"

export async function GET(request: NextRequest) {
  try {
    // Get trainer ID from cookies
    const cookieStore = cookies()
    const trainerIdCookie = cookieStore.get("trainerId")

    if (!trainerIdCookie?.value) {
      return NextResponse.json({ error: "Unauthorized - No trainer ID found" }, { status: 401 })
    }

    const trainerId = trainerIdCookie.value

    // Fetch clients using the Firebase service
    const clients = await fetchClients(trainerId)

    return NextResponse.json({ clients })
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const trainerIdCookie = cookieStore.get("trainerId")

    if (!trainerIdCookie?.value) {
      return NextResponse.json({ error: "Unauthorized - No trainer ID found" }, { status: 401 })
    }

    const trainerId = trainerIdCookie.value
    const body = await request.json()

    // Add client logic would go here
    // For now, return success
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error creating client:", error)
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 })
  }
}
