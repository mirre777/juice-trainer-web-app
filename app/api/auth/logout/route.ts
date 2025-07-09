import { NextResponse } from "next/server"

export async function POST() {
  try {
    console.log("[API:logout] 🔄 Processing logout")

    const response = NextResponse.json({ success: true })

    // Clear the user_id cookie
    response.cookies.set("user_id", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })

    console.log("[API:logout] ✅ Cleared user_id cookie")

    return response
  } catch (error) {
    console.error("[API:logout] ❌ Logout error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
