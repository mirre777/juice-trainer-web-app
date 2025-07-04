import { type NextRequest, NextResponse } from "next/server"
import { getCookie } from "cookies-next"
import { fetchClients } from "@/lib/firebase/client-service"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

export async function GET(request: NextRequest) {
  try {
    console.log("[API] /api/clients - Starting GET request")

    // Get user ID from cookies (same method as other working routes)
    const userId = getCookie("user_id", { req: request }) || getCookie("userId", { req: request })

    if (!userId) {
      console.log("[API] /api/clients - No user ID found in cookies")
      return NextResponse.json({ success: false, error: "No authentication token" }, { status: 401 })
    }

    console.log("[API] /api/clients - User ID found:", userId)

    // Use the existing fetchClients function directly
    console.log("[API] /api/clients - Calling fetchClients...")
    const clients = await fetchClients(userId as string)

    console.log(`[API] /api/clients - Successfully fetched ${clients.length} clients`)

    return NextResponse.json({
      success: true,
      clients: clients,
      clientCount: clients.length,
      totalClients: clients.length,
    })
  } catch (error) {
    console.error("[API] /api/clients - Unexpected error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[API] /api/clients - Starting POST request")

    // Get user ID from cookies (same method as GET)
    const userId = getCookie("user_id", { req: request }) || getCookie("userId", { req: request })

    if (!userId) {
      console.log("[API] /api/clients - POST No user ID found in cookies")
      return NextResponse.json({ success: false, error: "No authentication token" }, { status: 401 })
    }

    console.log("[API] /api/clients - POST User ID found:", userId)

    // Parse request body
    const body = await request.json()
    const { name, email, phone } = body

    console.log("[API] /api/clients - POST Creating client:", { name, email, phone, userId })

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 })
    }

    // Generate a unique invite code
    const inviteCode = Math.random().toString(36).substring(2, 15).toUpperCase()

    // Create client document in trainer's subcollection
    const clientsRef = collection(db, "users", userId as string, "clients")
    const clientData = {
      name: name.trim(),
      email: email?.trim() || "",
      phone: phone?.trim() || "",
      status: "Pending",
      inviteCode: inviteCode,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      progress: 0,
      sessions: { completed: 0, total: 0 },
      completion: 0,
      notes: "",
      goal: "",
      program: "",
      bgColor: "#f3f4f6",
      textColor: "#111827",
      lastWorkout: { name: "", date: "", completion: 0 },
      metrics: [],
      isTemporary: true, // Will be set to false when user accepts invitation
    }

    const docRef = await addDoc(clientsRef, clientData)

    console.log("[API] /api/clients - POST Client created with ID:", docRef.id)

    return NextResponse.json({
      success: true,
      clientId: docRef.id,
      inviteCode: inviteCode,
      message: "Client created successfully",
    })
  } catch (error) {
    console.error("[API] /api/clients - POST Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create client",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
