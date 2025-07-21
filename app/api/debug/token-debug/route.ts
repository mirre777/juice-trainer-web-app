import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    console.log("[API:token-debug] 🔍 Starting token debug")

    const cookieStore = cookies()
    const userIdCookie = cookieStore.get("user_id")

    const debugInfo = {
      timestamp: new Date().toISOString(),
      cookies: {
        user_id: userIdCookie?.value || "Not found",
      },
      headers: Object.fromEntries(request.headers.entries()),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        hasFirebaseConfig: !!(
          process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
          process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
        ),
      },
    }

    console.log("[API:token-debug] Debug info:", debugInfo)

    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error("[API:token-debug] ❌ Error:", error)
    return NextResponse.json(
      {
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
