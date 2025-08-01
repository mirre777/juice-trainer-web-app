export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/firebase/firebase"

export async function GET() {
  try {
    // Clear all cookies
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()

    for (const cookie of allCookies) {
      cookieStore.delete(cookie.name)
    }

    // Try to sign out from Firebase
    try {
      await auth.signOut()
    } catch (error) {
      console.error("Error signing out from Firebase:", error)
      // Continue with logout even if Firebase signOut fails
    }

    // Return success response with cleared cookies
    const response = new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    })
    response.cookies.set("token", "", {
      name: "token",
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 0,
    })
    response.cookies.set("user_id", "", {
      name: "user_id",
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 0,
    })
    response.cookies.set("refresh_token", "", {
      name: "refresh_token",
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 0,
    })

    return response
  } catch (error) {
    console.error("Error during logout:", error)
    return new NextResponse(JSON.stringify({ error: "Failed to logout" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
