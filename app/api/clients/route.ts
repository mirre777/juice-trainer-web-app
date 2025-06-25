import { type NextRequest, NextResponse } from "next/server"
import { getFirebaseAdminFirestore, initializeFirebaseAdmin } from "@/lib/firebase/firebase-admin"
import { createError, ErrorType, logError } from "@/lib/utils/error-handler"

// Initialize Firebase Admin SDK if not already done
initializeFirebaseAdmin()

export async function GET(request: NextRequest) {
  console.log("[API/clients] Received GET request.")
  console.log("[API/clients] Request URL:", request.url)
  console.log("[API/clients] Request Headers:", JSON.stringify(Object.fromEntries(request.headers.entries()), null, 2))

  try {
    // Attempt to get trainerId from headers set by middleware
    const trainerId = request.headers.get("x-user-id")
    console.log("[API/clients] Trainer ID from request headers (x-user-id):", trainerId)

    if (!trainerId) {
      // If x-user-id is not present, it means the middleware either didn't run,
      // or the session cookie was invalid/missing. Treat as unauthorized.
      const error = createError(
        ErrorType.API_UNAUTHORIZED,
        null,
        { function: "GET /api/clients" },
        "Unauthorized: Trainer ID not found in headers. Please ensure you are logged in.",
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
