import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[API:logout] 🔄 Processing logout request")

    const response = NextResponse.json({ success: true, message: "Logged out successfully" })

    // Clear the user_id cookie
    response.cookies.set("user_id", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })

    console.log("[API:logout] ✅ User logged out successfully")
    return response
  } catch (error) {
    console.error("[API:logout] ❌ Error during logout:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: "Logout endpoint - use POST method" }, { status: 405 })
}
