export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/firebase/firebase"
import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Clear the auth_token cookie
    cookies().delete("auth_token")

    // Try to sign out from Firebase
    try {
      await auth.signOut()
    } catch (error) {
      console.error("Error signing out from Firebase:", error)
      // Continue with logout even if Firebase signOut fails
    }

    return NextResponse.json({ success: true, message: "Logged out successfully" })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
