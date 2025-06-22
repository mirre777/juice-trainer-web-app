import { type NextRequest, NextResponse } from "next/server"
import { approveUser } from "@/lib/firebase/user-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { trainerId, userId, action, matchToClientId, createNew } = body

    if (!trainerId || !userId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const result = await approveUser(trainerId, userId, action, matchToClientId, createNew)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error approving/rejecting user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
