import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/firebase/client-service"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const userId = request.cookies.get("user_id")?.value

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!data.name) {
      return NextResponse.json({ error: "Client name is required" }, { status: 400 })
    }

    const result = await createClient(userId, {
      name: data.name,
      email: data.email || "",
      phone: data.phone || "",
      goal: data.goal || "",
      notes: data.notes || "",
      program: data.program || "",
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        clientId: result.clientId,
        inviteCode: result.inviteCode,
      })
    } else {
      return NextResponse.json({ error: result.error?.message || "Failed to create client" }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Error creating invitation:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
