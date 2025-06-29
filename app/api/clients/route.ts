// app/api/clients/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { initializeFirebaseAdmin, getFirebaseAdminFirestore } from "@/lib/firebase/firebase-admin"
import { cookies } from "next/headers"
import { createError, ErrorType, logError } from "@/lib/utils/error-handler"

// Initialize Firebase Admin SDK if not already done
initializeFirebaseAdmin()

export async function GET(request: NextRequest) {
  console.log("[API/clients] Received GET request.")
  try {
    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value
    console.log("[API/clients] User ID from cookie:", userId)

    if (!userId) {
      const error = createError(
        ErrorType.API_UNAUTHORIZED,
        null,
        { function: "GET /api/clients" },
        "Unauthorized: No user ID found.",
      )
      logError(error)
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    console.log(`[API/clients] Fetching clients for trainer: ${userId}`)

    // Use the Firebase Admin Firestore instance
    const adminDb = getFirebaseAdminFirestore()
    const clientsRef = adminDb.collection(`users/${userId}/clients`)
    const querySnapshot = await clientsRef.get()

    const clients = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    console.log(`[API/clients] Found ${clients.length} clients for trainer ${userId}.`)
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
