import { type NextRequest, NextResponse } from "next/server"
import { getLatestClientWorkout, getThisWeekWorkouts } from "@/lib/firebase/workout-service"
import { ErrorType, createError, logError } from "@/lib/utils/error-handler"
import { getTrainerIdFromCookie } from "@/lib/utils/user"
import { getClient } from "@/lib/firebase/client-service"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const { id: clientId } = await params

    if (!clientId) {
      console.error("API: Missing client ID")
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 })
    }

    console.log("API: Fetching workouts for client ID:", clientId)

    // Get trainer ID from cookie
    const trainerId = await getTrainerIdFromCookie()

    console.log("API: User ID from cookie:", trainerId)

    if (!trainerId) {
      console.error("API: No user ID found in cookie")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const client = await getClient(trainerId, clientId)

    if (!client) {
      console.error("API: Client not found")
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Fetch workouts using the existing service
    if (client.userId) {
      console.log("API: Fetching workouts for userId:", client.userId)
      const workouts = await getThisWeekWorkouts(client.userId)

      console.log("API: Fetched workouts:", workouts ? workouts.length : 0)

      return NextResponse.json({ workouts })
    } else {
      console.error("API: Client has no userId")
      return NextResponse.json({ workouts: [] })
    }
  } catch (error) {
    console.error("API: Unexpected error:", error)
    const appError = createError(
      ErrorType.API_SERVER_ERROR,
      error,
      { function: "GET /api/clients/[id]/workouts" },
      "Unexpected error fetching client workouts",
    )
    logError(appError)

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
