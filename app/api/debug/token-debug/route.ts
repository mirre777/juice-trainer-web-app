import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = cookies()

    // Get all possible auth-related cookies
    const authToken = cookieStore.get("auth-token")
    const authTokenAlt = cookieStore.get("auth_token")
    const sessionToken = cookieStore.get("session_token")
    const userId = cookieStore.get("user_id")

    // Get all cookies for debugging
    const allCookies: Record<string, string> = {}
    cookieStore.getAll().forEach((cookie) => {
      allCookies[cookie.name] = cookie.value
    })

    return NextResponse.json({
      cookies: {
        "auth-token": authToken?.value || null,
        auth_token: authTokenAlt?.value || null,
        session_token: sessionToken?.value || null,
        user_id: userId?.value || null,
      },
      allCookies,
      cookieCount: Object.keys(allCookies).length,
      authCookiesFound: [
        authToken && "auth-token",
        authTokenAlt && "auth_token",
        sessionToken && "session_token",
        userId && "user_id",
      ].filter(Boolean),
    })
  } catch (error) {
    return NextResponse.json({
      error: "Failed to read cookies",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
