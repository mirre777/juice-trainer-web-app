import { type NextRequest, NextResponse } from "next/server"
import { getFirebaseAdminAuth, getFirebaseAdminFirestore, initializeFirebaseAdmin } from "@/lib/firebase/firebase-admin"
import { cookies } from "next/headers"

// Initialize Firebase Admin SDK
initializeFirebaseAdmin()

export async function GET(request: NextRequest) {
  try {
    console.log("[API] /api/clients - GET request received")

    // Get session cookie
    const sessionCookie = cookies().get("session")?.value
    console.log("[API] Session cookie exists:", !!sessionCookie)

    if (!sessionCookie) {
      console.log("[API] No session cookie found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the session cookie
    const decodedClaims = await getFirebaseAdminAuth().verifySessionCookie(sessionCookie, true)
    const trainerId = decodedClaims.uid
    console.log("[API] Trainer ID from session:", trainerId)

    if (!trainerId) {
      console.log("[API] No trainer ID in session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get Firestore instance
    const db = getFirebaseAdminFirestore()

    // Query the clients collection for this trainer
    const clientsRef = db.collection(`users/${trainerId}/clients`)
    const snapshot = await clientsRef.where("deleted", "!=", true).get()

    console.log("[API] Found clients:", snapshot.size)

    const clients = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        name: data.name || "Unknown",
        email: data.email || "",
        status: data.status || "active",
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        initials: data.initials || data.name?.substring(0, 2)?.toUpperCase() || "??",
        bgColor: data.bgColor || "#f3f4f6",
        textColor: data.textColor || "#374151",
      }
    })

    console.log("[API] Returning clients:", clients.length)

    return NextResponse.json({ clients })
  } catch (error: any) {
    console.error("[API] Error in /api/clients:", error)

    if (error.code === "auth/session-cookie-expired") {
      return NextResponse.json({ error: "Session expired" }, { status: 401 })
    }

    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
