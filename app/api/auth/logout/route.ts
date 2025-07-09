import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[API:logout] 🔄 Processing logout request")

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    })

    // Clear all authentication cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 0, // Expire immediately
      path: "/",
    }

    response.cookies.set("user_id", "", cookieOptions)
    response.cookies.set("auth-token", "", cookieOptions)
    response.cookies.set("auth_token", "", cookieOptions)
    response.cookies.set("session_token", "", cookieOptions)

    console.log("[API:logout] ✅ All authentication cookies cleared")

    return response
  } catch (error) {
    console.error("[API:logout] ❌ Logout error:", error)
    return NextResponse.json(
      {
        error: "Logout failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: "Logout endpoint - use POST method" }, { status: 405 })
}
