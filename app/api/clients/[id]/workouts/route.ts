import { type NextRequest, NextResponse } from "next/server"
import { getThisWeekWorkouts, getWorkoutsByDateRange } from "@/lib/firebase/workout-service"
import { ErrorType, createError, logError } from "@/lib/utils/error-handler"
import { getTrainerIdFromCookie } from "@/lib/utils/user"
import { getClient } from "@/lib/firebase/client-service"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const { id: clientId } = await params

    if (!clientId) {
      console.error("API: Missing client ID")
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    console.log("API: Fetching workouts for client ID:", clientId)
    console.log("API: startDate param:", startDateParam)
    console.log("API: endDate param:", endDateParam)

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

    // Fetch workouts using the appropriate service
    if (client.userId) {
      console.log("API: Fetching workouts for userId:", client.userId)

      let workouts

      // Check if startDate and endDate are provided
      if (startDateParam && endDateParam) {
        const startDate = new Date(startDateParam)
        const endDate = new Date(endDateParam)

        // Validate dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.error("API: Invalid date parameters")
          return NextResponse.json({ error: "Invalid date parameters" }, { status: 400 })
        }

        console.log("API: Using custom date range:", startDate, "to", endDate)
        workouts = await getWorkoutsByDateRange(client.userId, startDate, endDate)
      } else {
        console.log("API: Using current week fallback")
        workouts = await getThisWeekWorkouts(client.userId)
      }

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
