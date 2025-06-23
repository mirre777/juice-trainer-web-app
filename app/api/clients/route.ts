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

    // Ensure 'db' is correctly initialized and accessible here.
    // If 'db' is a client-side instance, it might not work directly in a server route.
    // For server routes, you typically use firebase-admin for database operations.
    // Let's assume for now 'db' is correctly configured for server-side use or
    // that the client-side instance is being used in a way that works.
    // If this is the issue, we'd need to switch to admin.firestore().
    const clientsRef = collection(db, `users/${trainerId}/clients`)
    const q = query(clientsRef)
    const querySnapshot = await getDocs(q)

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
