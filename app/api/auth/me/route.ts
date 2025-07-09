import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserById } from "@/lib/firebase/user-service"

export async function GET(request: NextRequest) {
  try {
    console.log("[API:me] 🔄 Starting user data retrieval")

    const cookieStore = cookies()

    // Get user_id cookie (simple approach)
    const userIdCookie = cookieStore.get("user_id")

    if (!userIdCookie?.value) {
      console.log("[API:me] ❌ No user_id cookie found")
      return NextResponse.json({ error: "No authentication found" }, { status: 401 })
    }

    const userId = userIdCookie.value
    console.log("[API:me] ✅ Found user_id cookie:", userId)

    try {
      console.log("[API:me] 🔄 Fetching user data from Firestore...")
      const userData = await getUserById(userId)

      if (!userData) {
        console.log("[API:me] ❌ No user data found for ID:", userId)
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      console.log("[API:me] ✅ Successfully retrieved user data")
      console.log("[API:me] 👤 User role:", userData.role || "Not set")

      return NextResponse.json({
        user: {
          uid: userData.uid,
          email: userData.email,
          role: userData.role || "user",
          name: userData.name || userData.displayName || "",
          profilePicture: userData.profilePicture || "",
          isApproved: userData.isApproved || false,
          subscriptionStatus: userData.subscriptionStatus || "",
        },
      })
    } catch (firestoreError) {
      console.error("[API:me] ❌ Firestore error:", firestoreError)
      return NextResponse.json(
        {
          error: "Database error",
          details: firestoreError instanceof Error ? firestoreError.message : "Unknown error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[API:me] ❌ Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
