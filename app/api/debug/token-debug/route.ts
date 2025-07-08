import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/token-service"

export async function GET(request: NextRequest) {
  try {
    console.log(`[DEBUG:token] 🔍 Debugging token data`)

    // Get token from cookies
    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "No token found" }, { status: 401 })
    }

    console.log(`[DEBUG:token] 🔑 Token found: ${token.substring(0, 50)}...`)

    // Verify token
    let tokenData
    try {
      tokenData = await verifyToken(token)
      console.log(`[DEBUG:token] ✅ Token data:`, tokenData)
    } catch (tokenError: any) {
      console.log(`[DEBUG:token] ❌ Token verification failed:`, tokenError.message)
      return NextResponse.json({ error: "Token verification failed", details: tokenError.message }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      tokenData,
      tokenKeys: Object.keys(tokenData || {}),
      hasEmail: !!(tokenData?.email || tokenData?.user?.email),
      hasUid: !!(tokenData?.uid || tokenData?.user?.uid || tokenData?.id),
    })
  } catch (error: any) {
    console.error(`[DEBUG:token] ❌ Error:`, error)
    return NextResponse.json({ error: "Debug failed", details: error.message }, { status: 500 })
  }
}
