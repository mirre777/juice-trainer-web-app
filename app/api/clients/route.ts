// app/api/clients/route.ts
import { type NextRequest, NextResponse } from "next/server"
// REMOVE: import { collection, query, getDocs } from "firebase/firestore" // Client-side Firebase instance
import { getFirebaseAdminAuth, initializeFirebaseAdmin, getFirebaseAdminFirestore } from "@/lib/firebase/firebase-admin" // Server-side Firebase Admin
import { cookies } from "next/headers"
import { createError, ErrorType, logError } from "@/lib/utils/error-handler"

// Initialize Firebase Admin SDK if not already done
initializeFirebaseAdmin()

export async function GET(request: NextRequest) {
  console.log("[API/clients] Received GET request.")
  try {
    const sessionCookie = cookies().get("session")?.value
    console.log("[API/clients] Session cookie present:", !!sessionCookie)

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
    console.log("[API/clients] Trainer ID from session:", trainerId)

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

    // Use the Firebase Admin Firestore instance
    const adminDb = getFirebaseAdminFirestore()
    const clientsRef = adminDb.collection(`users/${trainerId}/clients`) // Corrected to use adminDb
    const querySnapshot = await clientsRef.get() // No need for `query` and `getDocs` from client SDK

    const clients = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    console.log(`[API/clients] Found ${clients.length} clients for trainer ${trainerId}.`)
    console.log("[API/clients] Clients data being sent:", JSON.stringify(clients, null, 2).substring(0, 500) + "...") // Log first 500 chars

    return NextResponse.json({ clients }, { status: 200 })
  } catch (error: any) {
    console.error("[API/clients] Error fetching clients:", error)
    let errorMessage = "An unexpected error occurred."
    let statusCode = 500

    if (error.code === "auth/session-cookie-expired") {
      errorMessage = "Session expired. Please log in again."
      statusCode = 401
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    const appError = createError(ErrorType.API_SERVER_ERROR, error, { function: "GET /api/clients" }, errorMessage)
    logError(appError)
    // Ensure error response is always JSON
    return NextResponse.json({ error: appError.message }, { status: statusCode })
  }
}
