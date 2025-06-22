import { type NextRequest, NextResponse } from "next/server"
import { updateUser, updateUniversalInviteCode } from "@/lib/firebase/user-service"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, phone, universalInviteCode } = body

    // Get user ID from cookie
    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Update basic profile info
    const profileUpdates: any = {}
    if (firstName !== undefined) profileUpdates.firstName = firstName
    if (lastName !== undefined) profileUpdates.lastName = lastName
    if (email !== undefined) profileUpdates.email = email
    if (phone !== undefined) profileUpdates.phone = phone

    if (Object.keys(profileUpdates).length > 0) {
      const profileResult = await updateUser(userId, profileUpdates)
      if (!profileResult.success) {
        return NextResponse.json({ error: profileResult.error }, { status: 500 })
      }
    }

    // Update invite code if provided
    if (universalInviteCode !== undefined) {
      const codeResult = await updateUniversalInviteCode(userId, universalInviteCode)
      if (!codeResult.success) {
        return NextResponse.json({ error: codeResult.error }, { status: 400 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
