import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    console.log("[DEBUG] Checking all cookies and authentication state")

    const cookieStore = cookies()

    // Get all cookies
    const allCookies = {}
    for (const [name, cookie] of cookieStore.getAll().map((c) => [c.name, c])) {
      allCookies[name] = cookie.value
    }

    // Check specific auth-related cookies
    const userIdCookie = cookieStore.get("user_id")
    const authTokenCookie = cookieStore.get("auth-token")
    const authToken2Cookie = cookieStore.get("auth_token")
    const sessionTokenCookie = cookieStore.get("session_token")

    const response = {
      success: true,
      cookies: {
        user_id: userIdCookie?.value || null,
        "auth-token": authTokenCookie?.value || null,
        auth_token: authToken2Cookie?.value || null,
        session_token: sessionTokenCookie?.value || null,
      },
      allCookies,
      cookieCount: Object.keys(allCookies).length,
      hasUserId: !!userIdCookie?.value,
      hasAnyAuthToken: !!(authTokenCookie?.value || authToken2Cookie?.value || sessionTokenCookie?.value),
      timestamp: new Date().toISOString(),
    }

    console.log("[DEBUG] Cookie analysis:", response)

    return NextResponse.json(response)
  } catch (error) {
    console.error("[DEBUG] Error analyzing cookies:", error)
    return NextResponse.json(
      {
        error: "Failed to analyze cookies",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
