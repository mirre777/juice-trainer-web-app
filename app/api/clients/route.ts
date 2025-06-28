import { type NextRequest, NextResponse } from "next/server"
import { getFirebaseAdminAuth, initializeFirebaseAdmin, getFirebaseAdminFirestore } from "@/lib/firebase/firebase-admin"
import { cookies } from "next/headers"
import { createError, ErrorType, logError } from "@/lib/utils/error-handler"

// Initialize Firebase Admin SDK if not already done
initializeFirebaseAdmin()

export async function GET(request: NextRequest) {
  console.log("[API/clients] Received GET request.")
  try {
    // Try session cookie first, then fall back to auth_token
    const sessionCookie = cookies().get("session")?.value
    const authToken = cookies().get("auth_token")?.value

    console.log("[API/clients] Session cookie present:", !!sessionCookie)
    console.log("[API/clients] Auth token present:", !!authToken)

    if (!sessionCookie && !authToken) {
      const error = createError(
        ErrorType.API_UNAUTHORIZED,
        null,
        { function: "GET /api/clients" },
        "Unauthorized: No authentication found.",
      )
      logError(error)
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    let trainerId: string

    try {
      if (sessionCookie) {
        // Verify session cookie
        const decodedClaims = await getFirebaseAdminAuth().verifySessionCookie(sessionCookie, true)
        trainerId = decodedClaims.uid
        console.log("[API/clients] Trainer ID from session:", trainerId)
      } else if (authToken) {
        // Verify ID token
        const decodedClaims = await getFirebaseAdminAuth().verifyIdToken(authToken)
        trainerId = decodedClaims.uid
        console.log("[API/clients] Trainer ID from token:", trainerId)
      } else {
        throw new Error("No valid authentication method")
      }
    } catch (authError: any) {
      console.error("[API/clients] Authentication error:", authError)

      let errorMessage = "Authentication failed"
      if (authError.code === "auth/session-cookie-expired" || authError.code === "auth/id-token-expired") {
        errorMessage = "Session expired. Please log in again."
      } else if (authError.code === "auth/argument-error") {
        errorMessage = "Invalid token. Please log in again."
      }

      const error = createError(ErrorType.API_UNAUTHORIZED, authError, { function: "GET /api/clients" }, errorMessage)
      logError(error)
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    if (!trainerId) {
      const error = createError(
        ErrorType.API_UNAUTHORIZED,
        null,
        { function: "GET /api/clients" },
        "Unauthorized: Trainer ID not found.",
      )
      logError(error)
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    console.log(`[API/clients] Fetching clients for trainer: ${trainerId}`)

    // Use the Firebase Admin Firestore instance
    const adminDb = getFirebaseAdminFirestore()
    const clientsRef = adminDb.collection(`users/${trainerId}/clients`)
    const querySnapshot = await clientsRef.get()

    const clients = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    console.log(`[API/clients] Found ${clients.length} clients for trainer ${trainerId}.`)

    return NextResponse.json({ clients }, { status: 200 })
  } catch (error: any) {
    console.error("[API/clients] Error fetching clients:", error)

    const appError = createError(
      ErrorType.API_SERVER_ERROR,
      error,
      { function: "GET /api/clients" },
      "Failed to fetch clients",
    )
    logError(appError)
    return NextResponse.json({ error: appError.message }, { status: 500 })
  }
}
