import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserById } from "@/lib/firebase/user-service"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const errorId = `ME_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  try {
    console.log(`[API:me] 🔍 Starting user verification (ID: ${errorId})`)

    // Get user ID from cookie
    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value

    if (!userId) {
      console.log(`[API:me] ❌ No user_id cookie found`)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log(`[API:me] 🔍 Looking up user: ${userId}`)

    // Get user data from Firestore
    let userData
    try {
      userData = await getUserById(userId)

      if (!userData) {
        console.log(`[API:me] ❌ User not found in database: ${userId}`)
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      console.log(`[API:me] ✅ User found:`)
      console.log(`[API:me] - Email: ${userData.email}`)
      console.log(`[API:me] - Role: ${userData.role || "Not set"}`)
      console.log(`[API:me] - Name: ${userData.name || "Not set"}`)
    } catch (firestoreError: any) {
      console.error(`[API:me] ❌ Firestore error:`, firestoreError)
      console.error(`[API:me] Error code: ${firestoreError.code}`)
      console.error(`[API:me] Error message: ${firestoreError.message}`)

      // Handle specific Firestore permission errors
      if (firestoreError.code === "permission-denied") {
        console.error(`[API:me] 🚫 Permission denied - check Firestore rules`)
        return NextResponse.json(
          {
            error: "Database permission error",
            errorId,
            details: "Missing or insufficient permissions.",
          },
          { status: 403 },
        )
      }

      return NextResponse.json(
        {
          error: "Database error",
          errorId,
          details: firestoreError.message,
        },
        { status: 500 },
      )
    }

    // Return user data in flat format (not nested)
    const response = {
      uid: userData.id || userId,
      email: userData.email,
      name: userData.name,
      role: userData.role || "user",
      status: userData.status,
      user_type: userData.user_type,
    }

    console.log(`[API:me] ✅ Returning user data:`, response)

    return NextResponse.json(response)
  } catch (error: any) {
    console.error(`[API:me] ❌ Unexpected error:`, error)
    return NextResponse.json(
      {
        error: "Internal server error",
        errorId,
        ...(process.env.NODE_ENV === "development" && {
          debug: {
            message: error.message,
            type: error.constructor.name,
          },
        }),
      },
      { status: 500 },
    )
  }
}
