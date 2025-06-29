import { type NextRequest, NextResponse } from "next/server"
import { getFirebaseAdminAuth, initializeFirebaseAdmin } from "@/lib/firebase/firebase-admin"
import { getFirestore } from "firebase-admin/firestore"

// Initialize Firebase Admin SDK
initializeFirebaseAdmin()

export async function GET(request: NextRequest) {
  try {
    // Get session cookie from request
    const sessionCookie = request.cookies.get("session")?.value

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the session cookie
    const decodedClaims = await getFirebaseAdminAuth().verifySessionCookie(sessionCookie, true)
    const trainerId = decodedClaims.uid

    if (!trainerId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    // Get Firestore instance
    const db = getFirestore()

    // Query the trainer's clients
    const clientsRef = db.collection("users").doc(trainerId).collection("clients")
    const snapshot = await clientsRef.get()

    const clients = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((client) => !client.deleted) // Filter out deleted clients

    console.log(`[API] Found ${clients.length} clients for trainer ${trainerId}`)

    return NextResponse.json({ clients })
  } catch (error: any) {
    console.error("Error fetching clients:", error)

    if (error.code === "auth/session-cookie-expired") {
      return NextResponse.json({ error: "Session expired" }, { status: 401 })
    }

    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}
