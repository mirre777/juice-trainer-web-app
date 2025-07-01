export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createTestClient } from "@/lib/firebase/client-service-fixed"

export async function POST() {
  try {
    console.log("🧪 [DEBUG] Creating test client")

    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value
    console.log("🆔 [DEBUG] User ID from cookie:", userId)

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const result = await createTestClient(userId)

    if (result.success) {
      console.log("✅ [DEBUG] Test client created successfully:", result.clientId)
      return NextResponse.json({
        success: true,
        message: "Test client created successfully",
        clientId: result.clientId,
      })
    } else {
      console.error("❌ [DEBUG] Failed to create test client:", result.error)
      return NextResponse.json(
        {
          success: false,
          error: result.error?.message || "Failed to create test client",
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("💥 [DEBUG] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unknown error",
        stack: error?.stack,
      },
      { status: 500 },
    )
  }
}
