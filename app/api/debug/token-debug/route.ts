import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    console.log("[DEBUG] Starting token debug")

    const cookieStore = cookies()

    // Get all possible auth cookies
    const userIdCookie = cookieStore.get("user_id")
    const authTokenCookie = cookieStore.get("auth-token")
    const authToken2Cookie = cookieStore.get("auth_token")
    const sessionTokenCookie = cookieStore.get("session_token")

    const allCookies = cookieStore.getAll()

    const debugInfo = {
      success: true,
      cookies: {
        user_id: userIdCookie?.value || null,
        "auth-token": authTokenCookie?.value || null,
        auth_token: authToken2Cookie?.value || null,
        session_token: sessionTokenCookie?.value || null,
      },
      allCookies: allCookies.map((cookie) => ({
        name: cookie.name,
        value: cookie.value.substring(0, 50) + (cookie.value.length > 50 ? "..." : ""),
      })),
      cookieCount: allCookies.length,
      timestamp: new Date().toISOString(),
    }

    console.log("[DEBUG] Cookie debug info:", debugInfo)

    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error("[DEBUG] Error in token debug:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
