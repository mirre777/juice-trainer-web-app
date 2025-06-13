import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase/firebase"
import { doc, getDoc } from "firebase/firestore"
import { getUserWorkouts } from "@/lib/firebase/workout-service"
import { ErrorType, createError, logError } from "@/lib/utils/error-handler"
import { cookies } from "next/headers"

export async function GET(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  try {
    const clientId = params.id

    if (!clientId) {
      console.error("API: Missing client ID")
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 })
    }

    console.log("API: Fetching workouts for client ID:", clientId)

    // Get trainer ID from cookie
    const cookieStore = cookies()
    const userIdCookie = cookieStore.get("user_id")
    const trainerId = userIdCookie?.value

    console.log("API: User ID from cookie:", trainerId)

    if (!trainerId) {
      console.error("API: No user ID found in cookie")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get the client document to find the userId
    const clientDocRef = doc(db, `users/${trainerId}/clients/${clientId}`)
    console.log("API: Looking up client document at path:", `users/${trainerId}/clients/${clientId}`)

    const clientDoc = await getDoc(clientDocRef)

    if (!clientDoc.exists()) {
      console.error("API: Client document not found")
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const clientData = clientDoc.data()
    const userId = clientData.userId

    console.log("API: Found client document with userId:", userId)

    if (!userId) {
      console.log("API: Client has no userId field")
      return NextResponse.json({ message: "Client has not created an account yet", workouts: [] }, { status: 200 })
    }

    // Fetch workouts using the existing service
    console.log("API: Fetching workouts for userId:", userId)
    const { workouts, error } = await getUserWorkouts(userId)

    console.log("API: Fetched workouts:", workouts ? workouts.length : 0, "Error:", error)

    if (error) {
      console.error("API: Error fetching workouts:", error)
      return NextResponse.json({ error: "Failed to fetch workouts" }, { status: 500 })
    }

    return NextResponse.json({ workouts })
  } catch (error) {
    console.error("API: Unexpected error:", error)
    const appError = createError(
      ErrorType.API_ERROR,
      error,
      { function: "GET /api/clients/[id]/workouts" },
      "Unexpected error fetching client workouts",
    )
    logError(appError)

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
