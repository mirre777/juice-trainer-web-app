import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    console.log("[DEBUG] Token debug endpoint called")

    const cookieStore = cookies()

    // Get all possible authentication cookies
    const userIdCookie = cookieStore.get("user_id")
    const authTokenCookie = cookieStore.get("auth-token")
    const authToken2Cookie = cookieStore.get("auth_token")
    const sessionTokenCookie = cookieStore.get("session_token")

    // Get all cookies for debugging
    const allCookies = request.cookies.getAll()

    const response = {
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
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        VERCEL_URL: process.env.VERCEL_URL,
      },
      firebaseConfig: {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "Present" : "Missing",
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "Present" : "Missing",
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "Present" : "Missing",
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? "Present" : "Missing",
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? "Present" : "Missing",
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? "Present" : "Missing",
      },
    }

    console.log("[DEBUG] Response:", JSON.stringify(response, null, 2))

    return NextResponse.json(response)
  } catch (error) {
    console.error("[DEBUG] Error:", error)
    return NextResponse.json(
      {
        error: "Debug endpoint failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
