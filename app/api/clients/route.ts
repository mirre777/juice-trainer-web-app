import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { collection, query, orderBy, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("[API /api/clients] === REQUEST RECEIVED ===")

    const cookieStore = cookies()
    const userIdCookie = cookieStore.get("user_id")

    if (!userIdCookie?.value) {
      console.log("[API /api/clients] ❌ No user_id cookie")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const userId = userIdCookie.value
    console.log(`[API /api/clients] 🔍 Fetching clients for user: ${userId}`)

    // Verify user exists and has trainer role
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      console.log(`[API /api/clients] ❌ User not found: ${userId}`)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userData = userDoc.data()
    if (userData.role !== "trainer") {
      console.log(`[API /api/clients] ❌ User is not a trainer: ${userData.role}`)
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Fetch clients
    const clientsRef = collection(db, "users", userId, "clients")
    const clientsQuery = query(clientsRef, orderBy("createdAt", "desc"))
    const snapshot = await getDocs(clientsQuery)

    const clients = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString(),
    }))

    console.log(`[API /api/clients] ✅ Found ${clients.length} clients`)

    return NextResponse.json({ clients })
  } catch (error: any) {
    console.log("[API /api/clients] ❌ Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch clients",
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
