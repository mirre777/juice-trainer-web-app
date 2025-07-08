export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/token-service"
import { getUserProfile } from "@/lib/firebase/user-service"

export async function GET(request: NextRequest) {
  try {
    console.log("[/api/auth/me] Starting user profile fetch...")

    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      console.log("[/api/auth/me] No auth token found")
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    console.log("[/api/auth/me] Token found, verifying...")

    // Verify the token
    const decoded = await verifyToken(token)
    if (!decoded || !decoded.uid) {
      console.log("[/api/auth/me] Token verification failed")
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    console.log("[/api/auth/me] Token verified for user:", decoded.email)

    // Always fetch fresh data from Firestore
    console.log("[/api/auth/me] Fetching fresh user data from Firestore...")
    const userProfile = await getUserProfile(decoded.email)

    if (!userProfile) {
      console.log("[/api/auth/me] User profile not found in Firestore for:", decoded.email)
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    console.log("[/api/auth/me] User profile fetched successfully:", {
      email: userProfile.email,
      role: userProfile.role,
      name: userProfile.name,
    })

    // Return the fresh user data
    const response = {
      user: {
        uid: decoded.uid,
        email: userProfile.email,
        name: userProfile.name || decoded.name,
        role: userProfile.role || "user", // Default to "user" if no role
        user_type: userProfile.user_type,
        hasFirebaseAuth: userProfile.hasFirebaseAuth,
        profilePicture: userProfile.profilePicture,
        createdAt: userProfile.createdAt,
        updatedAt: userProfile.updatedAt,
      },
    }

    console.log("[/api/auth/me] Returning user data with role:", response.user.role)

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error("[/api/auth/me] Error fetching user profile:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch user profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
