import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/token-service"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

export async function GET(request: NextRequest) {
  try {
    console.log("[API] GET /api/clients - Starting request")

    // Get the auth token from cookies
    const cookieStore = cookies()
    const authCookie = cookieStore.get("auth_token")

    if (!authCookie?.value) {
      console.log("[API] No auth token found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the token and get user info
    const decoded = await verifyToken(authCookie.value)
    if (!decoded || !decoded.uid) {
      console.log("[API] Invalid token")
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    console.log("[API] Authenticated user:", decoded.uid)

    // Query clients for this trainer
    const clientsRef = collection(db, "users", decoded.uid, "clients")
    const clientsQuery = query(clientsRef, where("deleted", "!=", true))

    const snapshot = await getDocs(clientsQuery)
    const clients = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    console.log("[API] Found clients:", clients.length)

    return NextResponse.json({ clients })
  } catch (error) {
    console.error("[API] Error fetching clients:", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}
