export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    console.log("🧪 [CREATE-TEST] Creating test client")

    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value
    console.log("🆔 [CREATE-TEST] User ID from cookie:", userId)

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
        },
        { status: 401 },
      )
    }

    // Import Firebase functions
    const { db } = await import("@/lib/firebase/firebase")
    const { collection, addDoc, serverTimestamp } = await import("firebase/firestore")

    const testClientData = {
      name: `Test Client ${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      phone: "+1234567890",
      status: "pending",
      notes: "Created by test script",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      progress: 0,
      sessions: { completed: 0, total: 0 },
      completion: 0,
    }

    console.log("📝 [CREATE-TEST] Creating client with data:", testClientData)

    const clientsRef = collection(db, "users", userId, "clients")
    const docRef = await addDoc(clientsRef, testClientData)

    console.log("✅ [CREATE-TEST] Test client created with ID:", docRef.id)

    return NextResponse.json({
      success: true,
      clientId: docRef.id,
      clientData: testClientData,
    })
  } catch (error: any) {
    console.error("💥 [CREATE-TEST] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
