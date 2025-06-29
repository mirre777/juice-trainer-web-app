export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Clear all cookies
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()

    for (const cookie of allCookies) {
      cookieStore.delete(cookie.name)
    }

    // Return success response with cleared cookies
    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Set cookie to expire in the past to ensure it's deleted
        "Set-Cookie": [
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

export async function POST() {
  try {
    // Clear all cookies
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()

    for (const cookie of allCookies) {
      cookieStore.delete(cookie.name)
    }

    // Return success response with cleared cookies
    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Set cookie to expire in the past to ensure it's deleted
        "Set-Cookie": [
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
