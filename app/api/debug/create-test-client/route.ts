export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    console.log("🧪 [CREATE-TEST] Creating test client")

    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value
    console.log("🆔 [CREATE-TEST] User ID:", userId)

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Import Firebase functions
    const { db } = await import("@/lib/firebase/firebase")
    const { collection, addDoc, serverTimestamp } = await import("firebase/firestore")

    console.log("📝 [CREATE-TEST] Creating test client document...")

    const testClient = {
      name: "Test Client API",
      email: "test-api@example.com",
      phone: "+1234567890",
      status: "pending",
      notes: "Created via API test endpoint",
      goals: ["Test goal"],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      progress: 0,
      completion: 0,
      bgColor: "#f3f4f6",
      textColor: "#111827",
      sessions: { completed: 0, total: 0 },
      lastWorkout: { name: "", date: "", completion: 0 },
      metrics: [],
      goal: "Test goal",
      program: "",
      inviteCode: "",
      userId: "",
    }

    const clientsRef = collection(db, "users", userId, "clients")
    const docRef = await addDoc(clientsRef, testClient)

    console.log("✅ [CREATE-TEST] Test client created with ID:", docRef.id)

    return NextResponse.json({
      success: true,
      clientId: docRef.id,
      message: "Test client created successfully",
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
