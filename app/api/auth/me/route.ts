import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/token-service"
import { getUserProfile } from "@/lib/firebase/user-service"

function generateErrorId() {
  return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export async function GET(request: NextRequest) {
  const errorId = generateErrorId()

  try {
    console.log(`[API:me] 🔄 Fetching user profile (ID: ${errorId})`)

    // Get token from cookies
    const cookieStore = cookies()
    const token =
      cookieStore.get("auth-token")?.value ||
      cookieStore.get("auth_token")?.value ||
      cookieStore.get("session_token")?.value

    if (!token) {
      console.log(`[API:me] ❌ No authentication token found`)
      return NextResponse.json({ error: "No authentication token found", errorId }, { status: 401 })
    }

    console.log(`[API:me] 🔑 Token found: ${token.substring(0, 20)}...`)

    // Verify token
    let tokenData
    try {
      tokenData = await verifyToken(token)
      console.log(`[API:me] ✅ Token verified for user: ${tokenData.email}`)
    } catch (tokenError: any) {
      console.log(`[API:me] ❌ Token verification failed:`, tokenError.message)
      return NextResponse.json({ error: "Invalid or expired token", errorId }, { status: 401 })
    }

    // Fetch fresh user data from Firestore
    let userProfile
    try {
      console.log(`[API:me] 🔄 Fetching fresh user data from Firestore for: ${tokenData.email}`)
      userProfile = await getUserProfile(tokenData.email)

      if (!userProfile) {
        console.log(`[API:me] ❌ User profile not found in Firestore for: ${tokenData.email}`)
        return NextResponse.json({ error: "User profile not found", errorId }, { status: 404 })
      }

      console.log(`[API:me] ✅ User profile fetched successfully:`, {
        email: userProfile.email,
        role: userProfile.role,
        name: userProfile.name,
      })
    } catch (firestoreError: any) {
      console.error(`[API:me] ❌ Firestore error:`, firestoreError)
      return NextResponse.json(
        {
          error: "Failed to retrieve user profile. Please try again.",
          errorId,
        },
        { status: 500 },
      )
    }

    // Return user data
    const response = {
      user: {
        uid: userProfile.uid,
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role,
        user_type: userProfile.user_type,
        profilePicture: userProfile.profilePicture,
        isApproved: userProfile.isApproved,
        subscriptionStatus: userProfile.subscriptionStatus,
      },
    }

    console.log(`[API:me] 🎉 Returning user data:`, {
      email: response.user.email,
      role: response.user.role,
      name: response.user.name,
    })

    return NextResponse.json(response)
  } catch (error: any) {
    console.error(`[API:me] ❌ Unexpected error (ID: ${errorId}):`, error)
    return NextResponse.json(
      {
        error: "Failed to retrieve user profile. Please try again.",
        errorId,
        ...(process.env.NODE_ENV === "development" && {
          debug: {
            message: error.message,
            stack: error.stack,
          },
        }),
      },
      { status: 500 },
    )
  }
}
