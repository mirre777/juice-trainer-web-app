import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

export async function GET(request: NextRequest) {
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
      console.log("🔍 Querying Firestore for clients of trainer:", userId)

      // Query clients from the trainer's subcollection
      const clientsRef = collection(db, "users", userId, "clients")
      const clientsQuery = query(
        clientsRef,
        where("status", "!=", "Deleted"),
        orderBy("status"),
        orderBy("createdAt", "desc"),
      )

      const snapshot = await getDocs(clientsQuery)

      console.log("✅ Clients query completed, found:", snapshot.size, "clients")

      const clients: any[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        clients.push({
          id: doc.id,
          ...data,
        })
      })

      console.log("📤 Sending clients response:", clients.length, "clients")
      return NextResponse.json({ clients })
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
