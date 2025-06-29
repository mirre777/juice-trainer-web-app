import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { auth } from "@/lib/firebase/firebase"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()

    // Try to get auth token from cookies
    const authToken =
      cookieStore.get("auth_token")?.value || cookieStore.get("session")?.value || cookieStore.get("authToken")?.value

    if (!authToken) {
      return NextResponse.json({ error: "No authentication token found" }, { status: 401 })
    }

    // Verify the token with Firebase
    const decodedToken = await auth.verifyIdToken(authToken)

    if (!decodedToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Return user data
    return NextResponse.json({
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.email?.split("@")[0],
      displayName: decodedToken.name || decodedToken.email?.split("@")[0],
      role: decodedToken.role || "trainer",
      emailVerified: decodedToken.email_verified,
    })
  } catch (error) {
    console.error("Auth verification error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
  }
}
