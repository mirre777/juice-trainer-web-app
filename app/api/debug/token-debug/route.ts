import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/token-service"

export async function GET(request: NextRequest) {
  try {
    console.log(`[DEBUG:token] 🔍 Starting token debug...`)

    // Get token from cookies
    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({
        error: "No token found",
        cookies: {
          "auth-token": cookieStore.get("auth-token")?.value,
          auth_token: cookieStore.get("auth_token")?.value,
          session_token: cookieStore.get("session_token")?.value,
        },
      })
    }

    console.log(`[DEBUG:token] 🔑 Token found: ${token.substring(0, 20)}...`)

    // Verify token
    let tokenData
    try {
      tokenData = await verifyToken(token)
      console.log(`[DEBUG:token] ✅ Token verified`)
    } catch (tokenError: any) {
      return NextResponse.json({
        error: "Token verification failed",
        details: tokenError.message,
        token: token.substring(0, 50) + "...",
      })
    }

    return NextResponse.json({
      success: true,
      tokenData,
      tokenType: typeof tokenData,
      isArray: Array.isArray(tokenData),
      tokenLength: Array.isArray(tokenData) ? tokenData.length : "N/A",
      firstElement: Array.isArray(tokenData) ? tokenData[0] : "N/A",
    })
  } catch (error: any) {
    console.error(`[DEBUG:token] ❌ Error:`, error)
    return NextResponse.json({
      error: "Debug failed",
      details: error.message,
    })
  }
}
