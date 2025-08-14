import { type NextRequest, NextResponse } from "next/server"
import { approveUser, getUserById, rejectUser } from "@/lib/firebase/user-service"
import { createClient, updateClient } from "@/lib/firebase/client-service"

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

    if (action === "approve") {
      await approveUser(userId, trainerId)
      if (matchToClientId) {
        // update client with user id
        await updateClient(trainerId, matchToClientId, {
          userId,
        })
      } else {
        // create new client
        const user = await getUserById(userId)
        await createClient(trainerId, {
          name: user?.name || "",
          email: user?.email || "",
          userId,
        })
        return NextResponse.json({ success: true })
      }
    } else if (action === "reject") {
      await rejectUser(userId, trainerId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error approving/rejecting user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
