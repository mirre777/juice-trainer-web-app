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
    const decodedToken = await verifyAuthToken(token)

    if (!decodedToken || !decodedToken.uid) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const userId = decodedToken.uid

    // Get trainer ID from query params
    const { searchParams } = new URL(request.url)
    const trainerId = searchParams.get("trainerId") || userId

    // Fetch clients from the trainer's subcollection
    const clientsRef = collection(db, "users", trainerId, "clients")
    const clientsQuery = query(clientsRef, where("deleted", "!=", true))

    const clientsSnapshot = await getDocs(clientsQuery)
    const clients = clientsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({ clients })
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}
