import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchClients } from "@/lib/firebase/client-service"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

export async function GET(request: NextRequest) {
  console.log("[API /api/clients] === GET REQUEST RECEIVED ===")

  try {
    // Use the SAME authentication method as your existing working routes
    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value
    const userIdAlt = cookieStore.get("userId")?.value // Fallback for inconsistent naming
    const trainerId = userId || userIdAlt

    console.log("🔍 [API /api/clients] Auth check:", {
      userId,
      userIdAlt,
      trainerId,
      hasCookies: !!cookieStore,
    })

    if (!trainerId) {
      console.log("❌ [API /api/clients] No trainer ID found in cookies")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    console.log("✅ [API /api/clients] Authenticated trainer:", trainerId)

    // Use your existing fetchClients function - NO server-side filtering
    console.log("📊 [API /api/clients] Calling fetchClients...")
    const allClients = await fetchClients(trainerId)
    console.log("[API /api/clients] Raw clients from fetchClients:", allClients.length)

    // Return ALL clients - no filtering
    console.log("[API /api/clients] Returning ALL clients without any filtering")

    return NextResponse.json({
      success: true,
      clients: allClients,
      totalClients: allClients.length,
    })
  } catch (error) {
    console.error("[API /api/clients] ❌ Error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch clients" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  console.log("[API /api/clients] === POST REQUEST RECEIVED ===")

  try {
    // Get authentication
    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value
    const userIdAlt = cookieStore.get("userId")?.value
    const trainerId = userId || userIdAlt

    if (!trainerId) {
      console.log("❌ [API /api/clients] No trainer ID found in cookies")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { name, email, phone } = body

    console.log("📝 [API /api/clients] Creating client:", { name, email, phone, trainerId })

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 })
    }

    // Generate a unique invite code
    const inviteCode = Math.random().toString(36).substring(2, 15).toUpperCase()

    // Create client document in trainer's subcollection
    const clientsRef = collection(db, "users", trainerId, "clients")
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

    console.log("✅ [API /api/clients] Client created with ID:", docRef.id)

    return NextResponse.json({
      success: true,
      clientId: docRef.id,
      inviteCode: inviteCode,
      message: "Client created successfully",
    })
  } catch (error) {
    console.error("[API /api/clients] ❌ POST Error:", error)
    return NextResponse.json({ success: false, error: "Failed to create client" }, { status: 500 })
  }
}
