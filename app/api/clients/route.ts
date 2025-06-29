import { type NextRequest, NextResponse } from "next/server"
import { getFirebaseAdminFirestore } from "@/lib/firebase/firebase-admin"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const trainerId = searchParams.get("trainerId") || cookies().get("userId")?.value || ""

    console.log("API Route - Trainer ID:", trainerId)

    if (!trainerId) {
      return NextResponse.json({ error: "Unauthorized - Trainer ID not found" }, { status: 401 })
    }

    const db = getFirebaseAdminFirestore()
    const clientsSnapshot = await db.collection(`trainers/${trainerId}/clients`).get()

    const clients = clientsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    console.log(`Found ${clients.length} clients for trainer ${trainerId}`)

    return NextResponse.json(clients)
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}
