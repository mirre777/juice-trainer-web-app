import { type NextRequest, NextResponse } from "next/server"
import { getFirebaseAdminFirestore, initializeFirebaseAdmin, getFirebaseAdminAuth } from "@/lib/firebase/firebase-admin"
import { createError, ErrorType, logError } from "@/lib/utils/error-handler" // Corrected import for AppError

// Initialize Firebase Admin SDK if not already done
initializeFirebaseAdmin()

export async function GET(request: NextRequest) {
  console.log("[API/clients] Received GET request.")
  console.log("[API/clients] Request URL:", request.url)
  console.log("[API/clients] Request Headers:", JSON.stringify(Object.fromEntries(request.headers.entries()), null, 2))

  try {
    // Get the auth_token from the cookies
    const authCookie = request.cookies.get("auth_token")
    const token = authCookie?.value

    if (!token) {
      const error = createError(
        ErrorType.API_UNAUTHORIZED,
        null,
        { function: "GET /api/clients" },
        "Unauthorized: No authentication token found.",
      )
      logError(error)
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    let trainerId: string
    try {
      const decodedClaims = await getFirebaseAdminAuth().verifyIdToken(token)
      trainerId = decodedClaims.uid
      console.log(`[API/clients] Token verified. Trainer ID: ${trainerId}`)
    } catch (tokenError: any) {
      console.error("[API/clients] Firebase ID token verification failed:", tokenError)
      const error = createError(
        ErrorType.AUTH_TOKEN_INVALID,
        tokenError,
        { function: "GET /api/clients" },
        "Unauthorized: Invalid or expired authentication token.",
      )
      logError(error)
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    console.log(`[API/clients] Fetching clients for trainer: ${trainerId}`)

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
    const statusCode = 500

    if (error instanceof Error) {
      errorMessage = error.message
    }

    const appError = createError(ErrorType.API_SERVER_ERROR, error, { function: "GET /api/clients" }, errorMessage)
    logError(appError)
    return NextResponse.json({ error: appError.message }, { status: statusCode })
  }
}
