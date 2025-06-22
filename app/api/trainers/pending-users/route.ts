export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { getPendingUsers } from "@/lib/firebase/user-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const trainerId = searchParams.get("trainerId")

    if (!trainerId) {
      return NextResponse.json({ error: "Trainer ID is required" }, { status: 400 })
    }

    const pendingUsers = await getPendingUsers(trainerId)

    return NextResponse.json({ pendingUsers })
  } catch (error) {
    console.error("Error fetching pending users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
