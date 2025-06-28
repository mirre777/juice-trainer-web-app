import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()

    // Create response
    const response = NextResponse.json({ message: "Logged out successfully" }, { status: 200 })

    // Clear all possible authentication cookies
    const cookiesToClear = ["session", "auth_token", "authToken", "firebase-auth-token", "__session"]

    cookiesToClear.forEach((cookieName) => {
      response.cookies.set(cookieName, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
      })
    })

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Internal server error during logout" }, { status: 500 })
  }
}
