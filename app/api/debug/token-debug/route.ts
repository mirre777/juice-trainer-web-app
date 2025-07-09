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
      return NextResponse.json({ error: "No token found" }, { status: 401 })
    }

    console.log(`[DEBUG:token] 🔑 Token found: ${token.substring(0, 20)}...`)

    // Verify token
    let tokenData
    try {
      tokenData = await verifyToken(token)
      console.log(`[DEBUG:token] ✅ Token verified:`, tokenData)
    } catch (tokenError: any) {
      console.log(`[DEBUG:token] ❌ Token verification failed:`, tokenError)
      return NextResponse.json(
        {
          error: "Token verification failed",
          details: tokenError.message,
        },
        { status: 401 },
      )
    }

    return NextResponse.json({
      success: true,
      tokenData,
      tokenType: typeof tokenData,
      isArray: Array.isArray(tokenData),
      tokenLength: Array.isArray(tokenData) ? tokenData.length : null,
    })
  } catch (error: any) {
    console.error(`[DEBUG:token] ❌ Error:`, error)
    return NextResponse.json(
      {
        error: "Debug failed",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
