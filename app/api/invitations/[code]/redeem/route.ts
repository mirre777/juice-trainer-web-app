
import { acceptInvitation } from "@/lib/firebase/trainer/trainer-service"
import { getUserIdFromCookie } from "@/lib/utils/user"
import { NextResponse } from "next/server"

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params

  const userId = await getUserIdFromCookie()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!code) {
    console.log(`[Accept Invitation] ❌ Missing invite code`)
    return NextResponse.json({ error: "Missing invite code" }, { status: 400 })
  }

  console.log(`[Accept Invitation] 🎯 Processing acceptance for code: ${code}, userId: ${userId}`)

  try {
    const { success, trainerId, clientId } = await acceptInvitation(code, userId)
    console.log(`[Accept Invitation] ✅ Invitation accepted successfully for trainer: ${code}`)

    if (!success) {
      return NextResponse.json({ error: "Failed to accept invitation" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Invitation accepted successfully",
      trainerId: trainerId,
      clientId: clientId,
    })
  } catch (error) {
    console.error("[Accept Invitation] ❌ Error accepting invitation:", error)
    return NextResponse.json({ error: "Failed to accept invitation" }, { status: 500 })
  }
}
