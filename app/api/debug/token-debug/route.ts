import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Debug: Checking cookies and environment...")

    // Check cookies
    const cookies = request.cookies.getAll()
    const cookieData = cookies.reduce(
      (acc, cookie) => {
        acc[cookie.name] = cookie.value
        return acc
      },
      {} as Record<string, string>,
    )

    // Check specific auth cookies
    const userId = request.cookies.get("user_id")?.value
    const authToken = request.cookies.get("auth-token")?.value || request.cookies.get("auth_token")?.value

    // Check environment variables (server-side only)
    const envCheck = {
      NEXT_PUBLIC_FIREBASE_API_KEY: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      NEXT_PUBLIC_FIREBASE_APP_ID: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }

    const response = {
      success: true,
      cookies: cookieData,
      authCookies: {
        user_id: userId || null,
        auth_token: authToken || null,
      },
      environment: envCheck,
      timestamp: new Date().toISOString(),
    }

    console.log("🔍 Debug response:", response)
    return NextResponse.json(response)
  } catch (error: any) {
    console.error("❌ Debug error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
