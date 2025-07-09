import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[API:logout] 🔄 Processing logout request")

    const response = NextResponse.json({ success: true, message: "Logged out successfully" })

    // Clear the user_id cookie
    response.cookies.set("user_id", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0, // Expire immediately
      path: "/",
    })

    console.log("[API:logout] ✅ User logged out successfully")
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
