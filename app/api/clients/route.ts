import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/firebase/client-service"
import { programConversionService } from "@/lib/firebase/program-conversion-service"
import { getCurrentUser } from "@/lib/auth/auth-service"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, goal, program } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const result = await createClient(userId, {
      name,
      email: email || "",
      goal: goal || "",
      program: program || "",
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        clientId: result.clientId,
        message: "Client created successfully",
      })
    } else {
      return NextResponse.json({ error: result.error?.message || "Failed to create client" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error creating client:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("[clients] API endpoint called")

    // Get current user (trainer)
    const user = await getCurrentUser()
    if (!user) {
      console.log("[clients] Unauthorized - no user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const trainerId = user.uid
    console.log(`[clients] Fetching clients for trainer: ${trainerId}`)

    // Get trainer's clients using the program conversion service
    // This will filter to only active clients with linked accounts
    const clients = await programConversionService.getTrainerClients(trainerId)

    console.log(`[clients] Found ${clients.length} active clients with linked accounts`)

    return NextResponse.json({
      success: true,
      clients,
    })
  } catch (error) {
    console.error("[clients] Error:", error)
    return NextResponse.json({ error: "Failed to fetch clients", details: error.message }, { status: 500 })
  }
}
