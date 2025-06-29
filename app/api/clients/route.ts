import { type NextRequest, NextResponse } from "next/server"
import { getFirebaseAdminAuth, getFirebaseAdminFirestore } from "@/lib/firebase/firebase-admin"
import { cookies } from "next/headers"

// Mark this route as dynamic
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get("session")?.value
    const authToken = cookieStore.get("auth_token")?.value

    if (!sessionCookie && !authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let userId: string

    try {
      if (sessionCookie) {
        const decodedClaims = await getFirebaseAdminAuth().verifySessionCookie(sessionCookie, true)
        userId = decodedClaims.uid
      } else if (authToken) {
        const decodedToken = await getFirebaseAdminAuth().verifyIdToken(authToken)
        userId = decodedToken.uid
      } else {
        return NextResponse.json({ error: "No valid authentication token" }, { status: 401 })
      }
    } catch (error) {
      console.error("Token verification failed:", error)
      return NextResponse.json({ error: "Invalid authentication token" }, { status: 401 })
    }

    // Get user document to find the trainer's user ID
    const db = getFirebaseAdminFirestore()
    const userDoc = await db.collection("users").doc(userId).get()

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userData = userDoc.data()
    const trainerId = userData?.id || userId

    console.log(`[API:clients] Fetching clients for trainer: ${trainerId}`)

    // Fetch clients from the trainer's clients subcollection
    const clientsSnapshot = await db
      .collection("users")
      .doc(trainerId)
      .collection("clients")
      .where("deleted", "!=", true)
      .get()

    const clients = clientsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    console.log(`[API:clients] Found ${clients.length} clients for trainer ${trainerId}`)

    return NextResponse.json({ clients })
  } catch (error) {
    console.error("[API:clients] Error fetching clients:", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}
