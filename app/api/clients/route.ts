import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/firebase/client-service"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, goal, program } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const result = await createClient(userId, {
      name,
      email: email || "",
      goal: goal || "",
      program: program || "",
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        clientId: result.clientId,
        message: "Client created successfully",
      })
    } else {
      return NextResponse.json({ error: result.error?.message || "Failed to create client" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error creating client:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const trainerId = searchParams.get("trainerId")
    const status = searchParams.get("status")

    console.log(`[GET /api/clients] Request params:`, { trainerId, status })

    if (!trainerId) {
      return NextResponse.json({ error: "trainerId is required" }, { status: 400 })
    }

    // Query the trainer's clients subcollection
    const clientsRef = collection(db, "users", trainerId, "clients")

    // Simple query without orderBy to avoid index issues
    const q = status ? query(clientsRef, where("status", "==", status)) : query(clientsRef)

    console.log(`[GET /api/clients] Querying clients for trainer: ${trainerId} with status: ${status || "all"}`)

    const querySnapshot = await getDocs(q)
    console.log(`[GET /api/clients] Found ${querySnapshot.size} clients`)

    const clients = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      console.log(`[GET /api/clients] Client ${doc.id}:`, {
        name: data.name,
        status: data.status,
        email: data.email,
      })

      // Only include valid client data
      if (data.name && typeof data.name === "string" && !data.name.includes("channel?VER=")) {
        clients.push({
          id: doc.id,
          name: data.name,
          email: data.email || "",
          status: data.status || "Pending",
          goal: data.goal || "",
          notes: data.notes || "",
          createdAt: data.createdAt,
        })
      }
    })

    // Sort clients by creation date (client-side since we removed orderBy)
    clients.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0
      return b.createdAt.seconds - a.createdAt.seconds
    })

    console.log(`[GET /api/clients] Returning ${clients.length} valid clients`)

    return NextResponse.json({
      success: true,
      clients: clients,
    })
  } catch (error) {
    console.error("[GET /api/clients] Error fetching clients:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
