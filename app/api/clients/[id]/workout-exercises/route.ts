import { type NextRequest, NextResponse } from "next/server"
import { getWorkoutExercises } from "@/lib/firebase/workout-exercise-service"
import { ErrorType, createError, logError } from "@/lib/utils/error-handler"
import { getTrainerIdFromCookie } from "@/lib/utils/user"
import { getClient } from "@/lib/firebase/client-service"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const { id: clientId } = await params
    // exerciseId comes from the query params
    const exerciseId = request.nextUrl.searchParams.get("exerciseId")
    console.log("API: Exercise ID:", exerciseId)

    if (!clientId || !exerciseId) {
      console.error("API: Missing client ID or exercise ID")
      return NextResponse.json({ error: "Client ID and exercise ID are required" }, { status: 400 })
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
      const workoutExercises = await getWorkoutExercises(client.userId, exerciseId)

      console.log("API: Fetched workouts-exercises:", workoutExercises ? workoutExercises.length : 0)

      return NextResponse.json({ workoutExercises })
    } else {
      console.error("API: Client has no userId")
      return NextResponse.json({ workoutExercises: [] })
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
