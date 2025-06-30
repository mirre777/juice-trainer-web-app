import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchClients } from "@/lib/firebase/client-service"

export async function GET(request: NextRequest) {
  try {
    // Get trainer ID from cookies
    const cookieStore = cookies()
    const userCookie = cookieStore.get("user")

    if (!userCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const userData = JSON.parse(userCookie.value)
    const trainerId = userData.uid

    if (!trainerId) {
      return NextResponse.json({ error: "Trainer ID not found" }, { status: 400 })
    }

    // Fetch clients using the Firebase service
    const clients = await fetchClients(trainerId)

    return NextResponse.json({ clients })
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}
