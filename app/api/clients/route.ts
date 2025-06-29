import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { auth } from "@/lib/firebase/firebase"
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore"

const db = getFirestore()

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()

    // Try to get auth token from cookies
    const authToken =
      cookieStore.get("auth_token")?.value || cookieStore.get("session")?.value || cookieStore.get("authToken")?.value

    if (!authToken) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Verify the token
    const decodedToken = await auth.verifyIdToken(authToken)

    if (!decodedToken) {
      return NextResponse.json({ error: "Invalid authentication token" }, { status: 401 })
    }

    // Get trainer ID from URL params
    const { searchParams } = new URL(request.url)
    const trainerId = searchParams.get("trainerId") || decodedToken.uid

    // Query clients for this trainer
    const clientsRef = collection(db, "clients")
    const q = query(clientsRef, where("trainerId", "==", trainerId))
    const querySnapshot = await getDocs(q)

    const clients = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({ clients })
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}
