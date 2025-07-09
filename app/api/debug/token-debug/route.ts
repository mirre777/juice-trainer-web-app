import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()

    // Get all possible cookies
    const userIdCookie = cookieStore.get("user_id")
    const authTokenCookie = cookieStore.get("auth-token")
    const authToken2Cookie = cookieStore.get("auth_token")
    const sessionTokenCookie = cookieStore.get("session_token")

    const allCookies = cookieStore.getAll()

    return NextResponse.json({
      success: true,
      cookies: {
        user_id: userIdCookie?.value || "Not found",
        "auth-token": authTokenCookie?.value || "Not found",
        auth_token: authToken2Cookie?.value || "Not found",
        session_token: sessionTokenCookie?.value || "Not found",
      },
      allCookies: allCookies.map((cookie) => ({
        name: cookie.name,
        value: cookie.value.substring(0, 50) + (cookie.value.length > 50 ? "..." : ""),
      })),
      cookieCount: allCookies.length,
    })
  } catch (error) {
    console.error("[Debug] Error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
