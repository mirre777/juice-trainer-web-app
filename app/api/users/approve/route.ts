import { type NextRequest, NextResponse } from "next/server"
import { approveUser } from "@/lib/firebase/simplified-user-service"

export async function POST(request: NextRequest) {
  try {
    const { trainerId, userId, action } = await request.json()

    if (!trainerId || !userId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await approveUser(trainerId, userId, action)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in approve route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
