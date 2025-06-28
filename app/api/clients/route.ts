// app/api/clients/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getFirebaseAdminAuth, initializeFirebaseAdmin, getFirebaseAdminFirestore } from "@/lib/firebase/firebase-admin"
import { cookies } from "next/headers"
import { createError, ErrorType, logError } from "@/lib/utils/error-handler"

// Initialize Firebase Admin SDK if not already done
initializeFirebaseAdmin()

export async function GET(request: NextRequest) {
  console.log("[API/clients] Received GET request.")
  try {
    // Fix: Use 'auth_token' instead of 'session' to match your auth system
    const authToken = cookies().get("auth_token")?.value
    console.log("[API/clients] Auth token present:", !!authToken)

    if (!authToken) {
      const error = createError(
        ErrorType.API_UNAUTHORIZED,
        null,
        { function: "GET /api/clients" },
        "Unauthorized: No auth token found.",
      )
      logError(error)
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    // Verify the auth token to get the trainer's UID
    const decodedClaims = await getFirebaseAdminAuth().verifyIdToken(authToken)
    const trainerId = decodedClaims.uid
    console.log("[API/clients] Trainer ID from token:", trainerId)

    if (!trainerId) {
      const error = createError(
        ErrorType.API_UNAUTHORIZED,
        null,
        { function: "GET /api/clients" },
        "Unauthorized: Trainer ID not found in token.",
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
    console.log("[API/clients] Clients data being sent:", JSON.stringify(clients, null, 2).substring(0, 500) + "...")

    return NextResponse.json({ clients }, { status: 200 })
  } catch (error: any) {
    console.error("[API/clients] Error fetching clients:", error)
    let errorMessage = "An unexpected error occurred."
    let statusCode = 500

    if (error.code === "auth/id-token-expired") {
      errorMessage = "Token expired. Please log in again."
      statusCode = 401
    } else if (error.code === "auth/argument-error") {
      errorMessage = "Invalid token. Please log in again."
      statusCode = 401
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    const appError = createError(ErrorType.API_SERVER_ERROR, error, { function: "GET /api/clients" }, errorMessage)
    logError(appError)
    return NextResponse.json({ error: appError.message }, { status: statusCode })
  }
}
