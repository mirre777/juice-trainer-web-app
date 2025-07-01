export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    console.log("🧪 [CREATE-TEST] Starting test client creation")

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

    console.log("📊 [CREATE-TEST] Creating test client...")

    const testClientData = {
      name: `Test Client ${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      phone: "123-456-7890",
      status: "Active",
      progress: 50,
      sessions: { completed: 5, total: 10 },
      completion: 50,
      notes: "This is a test client created by debug endpoint",
      goal: "Test goal",
      program: "Test program",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

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
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
