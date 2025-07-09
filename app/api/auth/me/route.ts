import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserById } from "@/lib/firebase/user-service"

export async function GET(request: NextRequest) {
  try {
    console.log("[API:me] Starting user data retrieval")

    const cookieStore = cookies()

    // Check for user_id cookie first (simpler approach)
    const userIdCookie = cookieStore.get("user_id")

    if (userIdCookie?.value) {
      console.log("[API:me] Found user_id cookie:", userIdCookie.value)

      try {
        const userData = await getUserById(userIdCookie.value)

        if (!userData) {
          console.log("[API:me] No user data found for ID:", userIdCookie.value)
          return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        console.log("[API:me] Successfully retrieved user data")
        return NextResponse.json({
          user: {
            uid: userData.uid,
            email: userData.email,
            role: userData.role || "user",
            name: userData.name || userData.displayName,
          },
        })
      } catch (firestoreError) {
        console.error("[API:me] Firestore error:", firestoreError)
        return NextResponse.json(
          {
            error: "Database error",
            details: firestoreError instanceof Error ? firestoreError.message : "Unknown error",
          },
          { status: 500 },
        )
      }
    }

    // If no user_id cookie, check for auth tokens
    const authToken = cookieStore.get("auth-token") || cookieStore.get("auth_token") || cookieStore.get("session_token")

    if (!authToken?.value) {
      console.log("[API:me] No authentication cookies found")
      return NextResponse.json({ error: "No authentication found" }, { status: 401 })
    }

    console.log("[API:me] Found auth token, checking if it's a simple user ID or JWT")

    // Check if token looks like a JWT (3 parts separated by dots)
    const tokenParts = authToken.value.split(".")

    if (tokenParts.length === 3) {
      // This looks like a JWT, but we don't have JWT_SECRET
      console.log("[API:me] Token looks like JWT but no JWT_SECRET configured")
      return NextResponse.json(
        {
          error: "JWT authentication not properly configured",
        },
        { status: 500 },
      )
    }

    // Treat token as a simple user ID
    console.log("[API:me] Treating token as simple user ID")
    try {
      const userData = await getUserById(authToken.value)

      if (!userData) {
        console.log("[API:me] No user data found for token ID:", authToken.value)
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      return NextResponse.json({
        user: {
          uid: userData.uid,
          email: userData.email,
          role: userData.role || "user",
          name: userData.name || userData.displayName,
        },
      })
    } catch (error) {
      console.error("[API:me] Error retrieving user data:", error)
      return NextResponse.json(
        {
          error: "Failed to retrieve user data",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[API:me] Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
