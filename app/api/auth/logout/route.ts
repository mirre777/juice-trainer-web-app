import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("🚪 Logout request received")

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    })

    // Clear the user_id cookie
    response.cookies.set("user_id", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0, // Expire immediately
      path: "/",
    })

    console.log("✅ User logged out, cookie cleared")
    return response
  } catch (error: any) {
    console.error("❌ Logout error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
