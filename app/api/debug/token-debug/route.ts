import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/token-service"

export async function GET(request: NextRequest) {
  try {
    console.log(`[DEBUG] Token debug endpoint called`)

    // Get token from cookies
    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({
        error: "No auth token found",
        cookies: {
          authToken: cookieStore.get("auth-token"),
          allCookies: cookieStore.getAll().map((c) => ({ name: c.name, hasValue: !!c.value })),
        },
      })
    }

    console.log(`[DEBUG] Token found: ${token.substring(0, 20)}...`)

    // Verify token
    let tokenData
    try {
      tokenData = await verifyToken(token)
      console.log(`[DEBUG] Token verified, raw data:`, tokenData)
    } catch (tokenError: any) {
      return NextResponse.json({
        error: "Token verification failed",
        details: tokenError.message,
        token: token.substring(0, 20) + "...",
      })
    }

    // Analyze token structure
    const analysis = {
      tokenExists: !!token,
      tokenDataType: typeof tokenData,
      isArray: Array.isArray(tokenData),
      tokenDataKeys: tokenData ? Object.keys(tokenData) : null,
      rawTokenData: tokenData,
    }

    if (Array.isArray(tokenData)) {
      analysis.arrayLength = tokenData.length
      analysis.firstElement = tokenData[0]
      analysis.firstElementType = typeof tokenData[0]
      analysis.firstElementKeys = tokenData[0] ? Object.keys(tokenData[0]) : null
    }

    return NextResponse.json({
      success: true,
      analysis,
      extractedData: {
        directAccess: {
          email: tokenData?.email,
          uid: tokenData?.uid,
          role: tokenData?.role,
        },
        arrayAccess: Array.isArray(tokenData)
          ? {
              email: tokenData[0]?.email,
              uid: tokenData[0]?.uid,
              role: tokenData[0]?.role,
            }
          : null,
      },
    })
  } catch (error: any) {
    console.error(`[DEBUG] Error in token debug:`, error)
    return NextResponse.json({
      error: "Debug endpoint error",
      details: error.message,
      stack: error.stack,
    })
  }
}
