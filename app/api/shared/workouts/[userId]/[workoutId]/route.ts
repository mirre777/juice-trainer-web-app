import { type NextRequest, NextResponse } from "next/server"
import { getUserWorkoutById } from "@/lib/firebase/workout-service"

export async function GET(request: NextRequest, { params }: { params: { userId: string; workoutId: string } }) {
  try {
    const { userId, workoutId } = params

    if (!userId || !workoutId) {
      return NextResponse.json({ error: "User ID and Workout ID are required" }, { status: 400 })
    }

    console.log(`[API] Fetching shared workout: ${workoutId} for user: ${userId}`)

    // For shared workouts, we need to fetch directly from the user's workout collection
    // We'll use a simplified version that doesn't require trainer/client relationship
    const { workout, error } = await getUserWorkoutById("", "", workoutId)

    if (error) {
      console.error("[API] Error fetching shared workout:", error)
      return NextResponse.json({ error: "Failed to fetch workout" }, { status: 500 })
    }

    if (!workout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 })
    }

    return NextResponse.json({ workout })
  } catch (error) {
    console.error("[API] Unexpected error in shared workout endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
