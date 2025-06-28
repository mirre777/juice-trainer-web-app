export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    // Clear all authentication cookies
    const cookieStore = cookies()

    // Delete all possible auth cookies
    cookieStore.delete("session")
    cookieStore.delete("auth_token")
    cookieStore.delete("token")
    cookieStore.delete("user_id")
    cookieStore.delete("refresh_token")

    // Return success response with cleared cookies
    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Set cookies to expire in the past to ensure they're deleted
        "Set-Cookie": [
          `session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
          `auth_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
          `token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
          `user_id=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
          `refresh_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
        ],
      },
    })
  } catch (error) {
    console.error("Error during logout:", error)
    return new NextResponse(JSON.stringify({ error: "Failed to logout" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
