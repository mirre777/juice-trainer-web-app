// app/api/clients/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { collection, query, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase" // Client-side Firebase instance
import { getFirebaseAdminAuth, initializeFirebaseAdmin } from "@/lib/firebase/firebase-admin" // Server-side Firebase Admin
import { cookies } from "next/headers"
import { createError, ErrorType, logError } from "@/lib/utils/error-handler"

// Initialize Firebase Admin SDK if not already done
initializeFirebaseAdmin()

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = cookies().get("session")?.value

    if (!sessionCookie) {
      const error = createError(
        ErrorType.API_UNAUTHORIZED,
        null,
        { function: "GET /api/clients" },
        "Unauthorized: No session found.",
      )
      logError(error)
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    // Verify the session cookie to get the trainer's UID
    const decodedClaims = await getFirebaseAdminAuth().verifySessionCookie(sessionCookie, true)
    const trainerId = decodedClaims.uid

    if (!trainerId) {
      const error = createError(
        ErrorType.API_UNAUTHORIZED,
        null,
        { function: "GET /api/clients" },
        "Unauthorized: Trainer ID not found in session.",
      )
      logError(error)
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    console.log(`[API/clients] Fetching clients for trainer: ${trainerId}`)

    const clientsRef = collection(db, `users/${trainerId}/clients`)
    const q = query(clientsRef)
    const querySnapshot = await getDocs(q)

    const clients = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    console.log(`[API/clients] Found ${clients.length} clients for trainer ${trainerId}.`)

    return NextResponse.json({ clients }, { status: 200 })
  } catch (error: any) {
    console.error("[API/clients] Error fetching clients:", error)
    if (error.code === "auth/session-cookie-expired") {
      return NextResponse.json({ error: "Session expired. Please log in again." }, { status: 401 })
    }
    const appError = createError(
      ErrorType.API_SERVER_ERROR,
      error,
      { function: "GET /api/clients" },
      "Failed to fetch clients.",
    )
    logError(appError)
    return NextResponse.json({ error: appError.message }, { status: 500 })
  }
}
