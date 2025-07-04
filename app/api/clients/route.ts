import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

export async function GET() {
  try {
    console.log("🚀 [API /api/clients] Starting client fetch...")

    // Use the same authentication method as your existing working routes
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
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    console.log("✅ [API /api/clients] Authenticated trainer:", trainerId)

    // Query clients collection - same pattern as your other Firebase queries
    console.log("📊 [API /api/clients] Querying clients collection...")
    const clientsRef = collection(db, "clients")
    const q = query(clientsRef, where("trainerId", "==", trainerId))
    const querySnapshot = await getDocs(q)

    const clients: any[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      clients.push({
        id: doc.id,
        ...data,
        // Ensure consistent data structure
        name: data.name || "Unknown Client",
        email: data.email || "",
        status: data.status || "Active",
        progress: data.progress || 0,
        sessions: data.sessions || { completed: 0, total: 0 },
        lastWorkout: data.lastWorkout || { name: "", date: "" },
        goal: data.goal || "",
        initials: data.initials || data.name?.substring(0, 2).toUpperCase() || "??",
        bgColor: data.bgColor || "#3B82F6",
        textColor: data.textColor || "#FFFFFF",
      })
    })

    console.log("✅ [API /api/clients] Successfully fetched clients:", {
      count: clients.length,
      trainerId,
    })

    return NextResponse.json({ clients })
  } catch (error) {
    console.error("❌ [API /api/clients] Error:", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}
