import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()

    // Get all possible auth cookies
    const authToken = cookieStore.get("auth-token")
    const authTokenAlt = cookieStore.get("auth_token")
    const sessionToken = cookieStore.get("session_token")
    const userId = cookieStore.get("user_id")

    console.log("=== TOKEN DEBUG ===")
    console.log("auth-token:", authToken?.value ? `${authToken.value.substring(0, 50)}...` : "Not found")
    console.log("auth_token:", authTokenAlt?.value ? `${authTokenAlt.value.substring(0, 50)}...` : "Not found")
    console.log("session_token:", sessionToken?.value ? `${sessionToken.value.substring(0, 50)}...` : "Not found")
    console.log("user_id:", userId?.value || "Not found")

    // Check if tokens look like JWTs (have 3 parts separated by dots)
    const tokenToCheck = authToken?.value || authTokenAlt?.value || sessionToken?.value
    let isJWT = false
    let tokenParts = null

    if (tokenToCheck) {
      tokenParts = tokenToCheck.split(".")
      isJWT = tokenParts.length === 3
      console.log("Token parts count:", tokenParts.length)
      console.log("Looks like JWT:", isJWT)

      if (isJWT) {
        try {
          // Try to decode the payload (middle part)
          const payload = JSON.parse(atob(tokenParts[1]))
          console.log("JWT Payload:", payload)
        } catch (e) {
          console.log("Failed to decode JWT payload:", e)
        }
      }
    }

    // Check environment variables
    console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET)
    console.log("JWT_SECRET value:", process.env.JWT_SECRET ? "Set" : "Not set")

    return NextResponse.json({
      cookies: {
        "auth-token": authToken?.value ? `${authToken.value.substring(0, 20)}...` : null,
        auth_token: authTokenAlt?.value ? `${authTokenAlt.value.substring(0, 20)}...` : null,
        session_token: sessionToken?.value ? `${sessionToken.value.substring(0, 20)}...` : null,
        user_id: userId?.value || null,
      },
      tokenAnalysis: {
        hasToken: !!tokenToCheck,
        isJWT,
        tokenParts: tokenParts?.length || 0,
      },
      environment: {
        hasJwtSecret: !!process.env.JWT_SECRET,
        nodeEnv: process.env.NODE_ENV,
      },
    })
  } catch (error) {
    console.error("Token debug error:", error)
    return NextResponse.json({ error: "Debug failed", details: error }, { status: 500 })
  }
}
