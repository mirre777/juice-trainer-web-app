export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { getUserById } from "@/lib/firebase/user-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log(`[DEBUG] Fetching user info for: ${userId}`)

    const user = await getUserById(userId)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Return user data with invitation code info
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        inviteCode: user.inviteCode || null,
        inviteCodeStoredAt: user.inviteCodeStoredAt || null,
        universalInviteCode: user.universalInviteCode || null,
        status: user.status,
        hasFirebaseAuth: user.hasFirebaseAuth,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        linkedAt: user.linkedAt,
        linkedDuring: user.linkedDuring,
      },
    })
  } catch (error) {
    console.error("[DEBUG] Error fetching user info:", error)
    return NextResponse.json({ error: "Failed to fetch user info" }, { status: 500 })
  }
}
