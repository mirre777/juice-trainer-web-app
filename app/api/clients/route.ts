import { type NextRequest, NextResponse } from "next/server"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { verifyAuthToken } from "@/lib/auth/token-service"

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = await verifyAuthToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const userId = decoded.uid

    // Get trainer ID from query params
    const { searchParams } = new URL(request.url)
    const trainerId = searchParams.get("trainerId") || userId

    // Query clients from the trainer's subcollection
    const clientsRef = collection(db, "users", trainerId, "clients")
    const clientsQuery = query(clientsRef, where("deleted", "!=", true))

    const snapshot = await getDocs(clientsQuery)
    const clients = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({ clients })
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}
