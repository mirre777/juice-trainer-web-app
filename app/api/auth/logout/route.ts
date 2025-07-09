import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    console.log("[API:logout] 🔄 Processing logout request")

    const cookieStore = cookies()

    // Clear the user_id cookie
    cookieStore.delete("user_id")

    // Also clear any legacy cookies that might exist
    cookieStore.delete("auth-token")
    cookieStore.delete("auth_token")
    cookieStore.delete("session_token")

    console.log("[API:logout] ✅ Cookies cleared successfully")

    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    })
  } catch (error) {
    console.error("[API:logout] ❌ Error during logout:", error)
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
