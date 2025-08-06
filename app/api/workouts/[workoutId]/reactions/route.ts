import { type NextRequest, NextResponse } from "next/server"
import { doc, updateDoc, arrayUnion, serverTimestamp, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { cookies } from "next/headers"

// Add validation functions at the top
function validateRequestBody(body: any): { emoji: string; userId: string } {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request body")
  }

  const { emoji, userId } = body

  if (!emoji || typeof emoji !== "string" || emoji.trim().length === 0) {
    throw new Error("Invalid or missing emoji")
  }

  if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
    throw new Error("Invalid or missing userId")
  }

  return { emoji: emoji.trim(), userId: userId.trim() }
}

function validateWorkoutId(workoutId: unknown): string {
  if (!workoutId || typeof workoutId !== "string" || workoutId.trim().length === 0) {
    throw new Error("Invalid workout ID")
  }
  return workoutId.trim()
}

function validateTrainerId(trainerId: unknown): string {
  if (!trainerId || typeof trainerId !== "string" || trainerId.trim().length === 0) {
    throw new Error("Invalid trainer ID")
  }
  return trainerId.trim()
}

// Update the POST function with comprehensive error handling
export async function POST(request: NextRequest, { params }: { params: Promise<{ workoutId: string }> }) {
  try {
    // Validate Firebase imports
    if (!doc || typeof doc !== "function") {
      console.error("❌ API: Firebase doc function not available")
      throw new Error("Firebase doc function not available")
    }
    if (!updateDoc || typeof updateDoc !== "function") {
      console.error("❌ API: Firebase updateDoc function not available")
      throw new Error("Firebase updateDoc function not available")
    }
    if (!arrayUnion || typeof arrayUnion !== "function") {
      console.error("❌ API: Firebase arrayUnion function not available")
      throw new Error("Firebase arrayUnion function not available")
    }
    if (!serverTimestamp || typeof serverTimestamp !== "function") {
      console.error("❌ API: Firebase serverTimestamp function not available")
      throw new Error("Firebase serverTimestamp function not available")
    }
    if (!db) {
      console.error("❌ API: Firebase database not initialized")
      throw new Error("Firebase database not initialized")
    }

    const { workoutId } = await params
    console.log(`🎯 API: Received reaction request for workout ${workoutId}`)

    let body
    try {
      body = await request.json()
      console.log(`🎯 API: Request body:`, body)
    } catch (error) {
      console.error(`❌ API: Failed to parse request body:`, error)
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { emoji, userId } = validateRequestBody(body)
    console.log(`🎯 API: Validated request data:`, { emoji, userId, workoutId })

    // Get trainer info from cookies/auth
    const cookieStore = await cookies()
    console.log(
      `🎯 API: All cookies:`,
      cookieStore.getAll().map((c) => c.name),
    )

    const userIdCookie = cookieStore.get("user_id")
    console.log(`🎯 API: user_id cookie:`, userIdCookie)

    const trainerId = validateTrainerId(userIdCookie?.value)
    console.log(`🎯 API: Trainer ID from cookies:`, trainerId)

    console.log(`💾 API: Saving reaction ${emoji} from trainer ${trainerId} to workout ${workoutId}`)

    // Create reaction object with validation
    const reaction = {
      trainerId,
      emoji,
      timestamp: serverTimestamp(),
    }

    console.log(`💾 API: Reaction object:`, reaction)

    // Validate reaction object
    if (!reaction.trainerId || !reaction.emoji || !reaction.timestamp) {
      console.error(`❌ API: Invalid reaction object:`, reaction)
      throw new Error("Failed to create valid reaction object")
    }

    // Update the workout document in the user's workouts collection
    const workoutRef = doc(db, `users/${userId}/workouts/${workoutId}`)
    console.log(`💾 API: Updating document at path: users/${userId}/workouts/${workoutId}`)

    // Check if document exists first
    const docSnap = await getDoc(workoutRef)
    console.log(`💾 API: Document exists: ${docSnap.exists()}`)

    if (!docSnap.exists()) {
      console.error(`❌ API: Document does not exist at path: users/${userId}/workouts/${workoutId}`)
      return NextResponse.json({ error: "Workout not found" }, { status: 404 })
    }

    await updateDoc(workoutRef, {
      reactions: arrayUnion(reaction),
      updatedAt: serverTimestamp(),
    })

    console.log(`✅ API: Successfully saved emoji reaction to database`)

    return NextResponse.json({
      success: true,
      reaction,
      message: "Reaction saved successfully",
    })
  } catch (error) {
    console.error("❌ API: Error saving workout reaction:", error)

    // Provide specific error messages based on error type
    let errorMessage = "Failed to save reaction"
    let statusCode = 500

    if (error instanceof Error) {
      if (error.message.includes("Invalid") || error.message.includes("missing")) {
        statusCode = 400
        errorMessage = error.message
      } else if (error.message.includes("not available") || error.message.includes("not initialized")) {
        statusCode = 503
        errorMessage = "Service temporarily unavailable"
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: statusCode },
    )
  }
}

// GET endpoint to fetch reactions for a workout
export async function GET(request: NextRequest, { params }: { params: Promise<{ workoutId: string }> }) {
  try {
    if (!db) {
      console.error("❌ API: Firebase database not initialized")
      throw new Error("Firebase database not initialized")
    }

    const { workoutId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const { doc: docRef, getDoc } = await import("firebase/firestore")
    const workoutRef = docRef(db, `users/${userId}/workouts/${workoutId}`)
    const workoutDoc = await getDoc(workoutRef)

    if (!workoutDoc.exists()) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 })
    }

    const workoutData = workoutDoc.data()
    const reactions = workoutData.reactions || []

    return NextResponse.json({ reactions })
  } catch (error) {
    console.error("❌ Error fetching workout reactions:", error)
    return NextResponse.json({ error: "Failed to fetch reactions" }, { status: 500 })
  }
}
