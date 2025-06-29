import { type NextRequest, NextResponse } from "next/server"
import { getFirebaseAdminAuth, getFirebaseAdminFirestore } from "@/lib/firebase/firebase-admin"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    // Get the session cookie
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get("session")?.value

    if (!sessionCookie) {
      return NextResponse.json({ error: "No session found" }, { status: 401 })
    }

    // Verify the session cookie
    const auth = getFirebaseAdminAuth()
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true)
    const userId = decodedClaims.uid

    // Get clients from Firestore
    const db = getFirebaseAdminFirestore()
    const clientsSnapshot = await db
      .collection("users")
      .doc(userId)
      .collection("clients")
      .where("deleted", "!=", true)
      .get()

    const clients = clientsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    console.log(`Fetched ${clients.length} clients for user ${userId}`)

    return NextResponse.json({ clients })
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}
