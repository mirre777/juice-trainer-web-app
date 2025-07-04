export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { UnifiedAuthService } from "@/lib/services/unified-auth-service"

export async function GET() {
  try {
    console.log("🚀 Starting /api/auth/me request")

    // Use unified auth service to get current user
    const authResult = await UnifiedAuthService.getCurrentUser()

    if (!authResult.success) {
      console.log("❌ Authentication failed:", authResult.error?.message)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (!authResult.user) {
      console.log("❌ No user data available")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = authResult.user
    console.log("✅ User data retrieved:", {
      uid: user.uid,
      email: user.email,
      role: user.role,
    })

    const response = {
      uid: user.uid,
      email: user.email,
      name: user.name || "",
      ...(user.role && { role: user.role }),
      ...(user.user_type && { user_type: user.user_type }),
      universalInviteCode: user.universalInviteCode || "",
      inviteCode: user.inviteCode || "",
    }

    console.log("📤 Sending successful response")
    return NextResponse.json(response)
  } catch (error: any) {
    console.error("💥 Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}
