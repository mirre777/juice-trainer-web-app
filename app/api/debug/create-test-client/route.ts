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

    const testClient = {
      name: "Test Client " + Date.now(),
      email: "test" + Date.now() + "@example.com",
      phone: "+1234567890",
      status: "active",
      notes: "Created by debug endpoint",
      goals: ["Test goal"],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    console.log("📝 [CREATE-TEST] Test client data:", testClient)

    const clientsRef = collection(db, "users", userId, "clients")
    const docRef = await addDoc(clientsRef, testClient)

    console.log("✅ [CREATE-TEST] Test client created with ID:", docRef.id)

    return NextResponse.json({
      success: true,
      clientId: docRef.id,
      testClient,
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
