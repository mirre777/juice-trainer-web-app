import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  console.log("[API /api/clients] === REQUEST RECEIVED ===")

  try {
    // Use the EXACT same authentication method as /api/auth/me
    console.log("🚀 Starting /api/clients request")

    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value
    console.log("🆔 User ID from cookie:", userId)

    if (!userId) {
      console.log("❌ No user_id in cookies")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    try {
      // Import Firestore directly (same as /api/auth/me)
      const { db } = await import("@/lib/firebase/firebase")
      console.log("📊 Firestore imported successfully")

      if (!db) {
        console.error("❌ Firestore not available")
        return NextResponse.json({ error: "Database not available" }, { status: 500 })
      }

      console.log("🔍 Querying Firestore for user:", userId)

      // Import collection and doc from firebase/firestore (same as /api/auth/me)
      const { collection, doc, getDoc, getDocs, query } = await import("firebase/firestore")

      // First verify user exists (same check as /api/auth/me)
      const userDocRef = doc(collection(db, "users"), userId)
      const userDoc = await getDoc(userDocRef)

      console.log("✅ User document query completed, exists:", userDoc.exists())

      if (!userDoc.exists()) {
        console.log("❌ User document not found for ID:", userId)
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const userData = userDoc.data()
      console.log("✅ User data extracted:", userData)

      // Now fetch clients for this user
      console.log("🔍 Fetching clients for trainer:", userId)
      const clientsRef = collection(db, "users", userId, "clients")
      const clientsQuery = query(clientsRef)
      const snapshot = await getDocs(clientsQuery)

      console.log("[API /api/clients] Raw Firestore query returned:", snapshot.size, "documents")

      const allClients: any[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        console.log(`[API /api/clients] Processing client ${doc.id}:`, {
          name: data.name,
          status: data.status,
          hasUserId: !!data.userId,
          hasLinkedAccount: data.hasLinkedAccount,
        })

        allClients.push({
          id: doc.id,
          name: data.name || "Unnamed Client",
          email: data.email || "",
          status: data.status || "Active",
          userId: data.userId || "",
          hasLinkedAccount: data.hasLinkedAccount || false,
          progress: data.progress || 0,
          sessions: data.sessions || { completed: 0, total: 0 },
          completion: data.completion || 0,
          notes: data.notes || "",
          bgColor: data.bgColor || "#f3f4f6",
          textColor: data.textColor || "#111827",
          lastWorkout: data.lastWorkout || { name: "", date: "", completion: 0 },
          metrics: data.metrics || [],
          goal: data.goal || "",
          program: data.program || "",
          createdAt: data.createdAt?.toDate?.() || new Date(),
          inviteCode: data.inviteCode || "",
          phone: data.phone || "",
          initials: data.name
            ? data.name
                .split(" ")
                .map((part: string) => part[0])
                .join("")
                .toUpperCase()
                .substring(0, 2)
            : "UC",
        })
      })

      // Filter clients to only include those with linked accounts and active status
      const activeLinkedClients = allClients.filter((client) => {
        const hasUserId = !!client.userId
        const isActive = client.status === "Active"
        const hasLinkedAccount = client.hasLinkedAccount

        console.log(`[API /api/clients] Client ${client.name}:`, {
          id: client.id,
          userId: client.userId || "NO_USER_ID",
          status: client.status,
          hasLinkedAccount,
          hasUserId,
          isActive,
          willInclude: hasUserId && isActive && hasLinkedAccount,
        })

        return hasUserId && isActive && hasLinkedAccount
      })

      console.log("[API /api/clients] ✅ Results:", {
        totalClients: allClients.length,
        activeLinkedClients: activeLinkedClients.length,
      })

      return NextResponse.json({
        success: true,
        clients: activeLinkedClients,
        totalClients: allClients.length,
        activeLinkedClients: activeLinkedClients.length,
      })
    } catch (firestoreError: any) {
      console.error("💥 Firestore error:", firestoreError)
      return NextResponse.json(
        {
          error: "Database error",
          details: firestoreError?.message || "Database connection failed",
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("💥 Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}
