export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    console.log("🧪 [DEBUG] Creating test client")

    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value
    console.log("🆔 [DEBUG] User ID from cookie:", userId)

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Import Firebase and service
    const { createClient } = await import("@/lib/firebase/client-service")

    // Create a test client with all required fields
    const testClientData = {
      name: "Test Client " + Date.now(),
      email: "test" + Date.now() + "@example.com",
      phone: "+1234567890",
      status: "Active",
      notes: "Test client created by debug endpoint",
      goals: ["Test goal"],
    }

    console.log("📝 [DEBUG] Creating client with data:", testClientData)

    const result = await createClient(userId, testClientData)

    console.log("✅ [DEBUG] Create result:", result)

    return NextResponse.json({
      success: result.success,
      clientId: result.clientId,
      error: result.error,
      testData: testClientData,
    })
  } catch (error: any) {
    console.error("💥 [DEBUG] Create test client error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
