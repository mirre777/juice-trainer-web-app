export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    console.log("🚀 [API] Starting /api/clients request")

    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value
    console.log("🆔 [API] User ID from cookie:", userId)

    if (!userId) {
      console.log("❌ [API] No user_id in cookies")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Import Firebase functions
    const { db } = await import("@/lib/firebase/firebase")
    const { collection, getDocs } = await import("firebase/firestore")

    console.log("📊 [API] Fetching clients for trainer:", userId)

    // Query clients collection directly (same as real-time listener)
    const clientsRef = collection(db, "users", userId, "clients")
    const snapshot = await getDocs(clientsRef)

    console.log(`📈 [API] Found ${snapshot.size} documents`)

    const clients: any[] = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      console.log(`[API] Processing document ${doc.id}:`, {
        name: data.name,
        email: data.email,
        status: data.status,
      })

      // Use the same validation as the real-time listener
      // (which is more lenient - just needs a name)
      if (data.name && typeof data.name === "string" && data.name.trim() !== "") {
        const client = {
          id: doc.id,
          name: data.name,
          email: data.email || "",
          phone: data.phone || "",
          status: data.status || "pending",
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          notes: data.notes || "",
          progress: data.progress || 0,
          sessions: data.sessions || { completed: 0, total: 0 },
          completion: data.completion || 0,
          bgColor: data.bgColor || "#f3f4f6",
          textColor: data.textColor || "#111827",
          lastWorkout: data.lastWorkout || { name: "", date: "", completion: 0 },
          metrics: data.metrics || [],
          goal: data.goal || "",
          program: data.program || "",
          inviteCode: data.inviteCode || "",
          userId: data.userId || "",
          initials: data.name
            .split(" ")
            .map((part: string) => part[0])
            .join("")
            .toUpperCase()
            .substring(0, 2),
        }

        clients.push(client)
        console.log(`[API] ✅ Added client: ${client.name}`)
      } else {
        console.log(`[API] ❌ Skipped invalid client: ${doc.id} (missing or invalid name)`)
      }
    })

    console.log(`✅ [API] Returning ${clients.length} clients`)

    return NextResponse.json({
      success: true,
      clients: clients,
      count: clients.length,
    })
  } catch (error: any) {
    console.error("💥 [API] Unexpected error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}
