import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth/token-service"
import { getUserById } from "@/lib/firebase/user-service"

export async function GET(request: NextRequest) {
  try {
    console.log("[API:auth/me] 🔄 Getting user info...")

    // Try to get token from multiple cookie names
    const authToken =
      request.cookies.get("auth-token")?.value ||
      request.cookies.get("auth_token")?.value ||
      request.cookies.get("session_token")?.value

    const userId = request.cookies.get("user_id")?.value

    console.log("[API:auth/me] 🍪 Cookies found:")
    console.log(`- auth-token: ${request.cookies.get("auth-token")?.value ? "Present" : "Missing"}`)
    console.log(`- auth_token: ${request.cookies.get("auth_token")?.value ? "Present" : "Missing"}`)
    console.log(`- user_id: ${userId || "Missing"}`)

    if (!authToken && !userId) {
      console.log("[API:auth/me] ❌ No authentication token or user ID found")
      return NextResponse.json({ error: "No authentication token found" }, { status: 401 })
    }

    let userData = null

    // Try to verify token first
    if (authToken) {
      try {
        console.log("[API:auth/me] 🔄 Verifying JWT token...")
        const decoded = await verifyToken(authToken)
        console.log("[API:auth/me] ✅ Token verified successfully")
        console.log(`[API:auth/me] 👤 Token user ID: ${decoded.uid}`)
        console.log(`[API:auth/me] 🎭 Token user role: ${decoded.role}`)

        // Get fresh user data from Firestore
        userData = await getUserById(decoded.uid)
        if (userData) {
          console.log("[API:auth/me] ✅ User data retrieved from Firestore via token")
          return NextResponse.json({
            uid: decoded.uid,
            email: decoded.email,
            role: userData.role || decoded.role,
            ...userData,
          })
        }
      } catch (tokenError) {
        console.log("[API:auth/me] ⚠️ Token verification failed, trying user ID fallback...")
        console.error("[API:auth/me] Token error:", tokenError)
      }
    }

    // Fallback to user ID cookie
    if (userId && !userData) {
      try {
        console.log(`[API:auth/me] 🔄 Fetching user data by ID: ${userId}`)
        userData = await getUserById(userId)
        if (userData) {
          console.log("[API:auth/me] ✅ User data retrieved from Firestore via user ID")
          return NextResponse.json({
            uid: userId,
            email: userData.email,
            role: userData.role || "user",
            ...userData,
          })
        }
      } catch (userError) {
        console.error("[API:auth/me] Error fetching user by ID:", userError)
      }
    }

    console.log("[API:auth/me] ❌ No valid user data found")
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  } catch (error) {
    console.error("[API:auth/me] 💥 Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
