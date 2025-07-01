export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    console.log("🧪 [CREATE-TEST] Creating test client")

    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Import Firebase functions
    const { db } = await import("@/lib/firebase/firebase")
    const { collection, addDoc, serverTimestamp } = await import("firebase/firestore")

    console.log("🧪 [CREATE-TEST] Creating test client for user:", userId)

    const testClient = {
      name: "Test Client " + Date.now(),
      email: "test" + Date.now() + "@example.com",
      phone: "+1234567890",
      status: "Active",
      notes: "Created by debug endpoint",
      goals: ["Test Goal"],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      progress: 0,
      completion: 0,
      bgColor: "#f3f4f6",
      textColor: "#111827",
    }

    const clientsRef = collection(db, "users", userId, "clients")
    const docRef = await addDoc(clientsRef, testClient)

    console.log("✅ [CREATE-TEST] Test client created with ID:", docRef.id)

    return NextResponse.json({
      success: true,
      clientId: docRef.id,
      testClient: {
        ...testClient,
        id: docRef.id,
      },
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
