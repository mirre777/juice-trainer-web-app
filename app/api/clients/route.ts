import { type NextRequest, NextResponse } from "next/server"
import { fetchClients } from "@/lib/firebase/client-service"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth-options"

export async function GET(request: NextRequest) {
  try {
    console.log("[API] /api/clients - Starting request")

    const session = await getServerSession(authOptions)

    if (!session?.user?.uid) {
      console.log("[API] /api/clients - No valid session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const trainerId = session.user.uid
    console.log(`[API] /api/clients - Fetching clients for trainer: ${trainerId}`)

    const clients = await fetchClients(trainerId)

    // Ensure we always return an array, even if fetchClients returns undefined/null
    const safeClients = Array.isArray(clients) ? clients : []

    console.log(`[API] /api/clients - Returning ${safeClients.length} clients`)

    return NextResponse.json({
      clients: safeClients,
      success: true,
    })
  } catch (error) {
    console.error("[API] /api/clients - Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch clients",
        clients: [], // Always provide empty array as fallback
        success: false,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[API] /api/clients - POST Starting request")

    const session = await getServerSession(authOptions)

    if (!session?.user?.uid) {
      console.log("[API] /api/clients - POST No valid session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const trainerId = session.user.uid
    const body = await request.json()
    const { name, email, phone } = body

    console.log("[API] /api/clients - POST Creating client:", { name, email, phone, trainerId })

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 })
    }

    // Generate a unique invite code
    const inviteCode = Math.random().toString(36).substring(2, 15).toUpperCase()

    // Create client document in trainer's subcollection
    const clientsRef = collection(db, "users", trainerId as string, "clients")
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
    return NextResponse.json({ success: false, error: "Failed to create client" }, { status: 500 })
  }
}
