export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    console.log("🚀 Starting /api/clients request")

    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value
    console.log("🆔 User ID from cookie:", userId)

    if (!userId) {
      console.log("❌ No user_id in cookies")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    try {
      // Import Firestore directly
      const { db } = await import("@/lib/firebase/firebase")
      console.log("📊 Firestore imported successfully")

      if (!db) {
        console.error("❌ Firestore not available")
        return NextResponse.json({ error: "Database not available" }, { status: 500 })
      }

      console.log("🔍 Querying Firestore for clients of trainer:", userId)

      // Import collection and query functions from firebase/firestore
      const { collection, query, orderBy, getDocs } = await import("firebase/firestore")

      // Query clients from the trainer's subcollection (correct path)
      const clientsRef = collection(db, "users", userId, "clients")
      const q = query(clientsRef, orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)

      console.log("✅ Clients query completed, found:", querySnapshot.size, "clients")

      const clients: any[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        // Filter out deleted clients
        if (data.status !== "Deleted") {
          clients.push({
            id: doc.id,
            ...data,
          })
        }
      })

      console.log("📤 Sending clients response:", clients.length, "clients")
      return NextResponse.json(clients)
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
