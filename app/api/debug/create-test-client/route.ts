export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    console.log("🧪 [DEBUG] Creating test client")

    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Import Firebase functions
    const { db } = await import("@/lib/firebase/firebase")
    const { collection, addDoc, serverTimestamp } = await import("firebase/firestore")

    const testClient = {
      name: "Test Client " + Date.now(),
      email: "test" + Date.now() + "@example.com",
      phone: "+1234567890",
      status: "pending",
      notes: "Created by debug endpoint",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const clientsRef = collection(db, "users", userId, "clients")
    const docRef = await addDoc(clientsRef, testClient)

    console.log("✅ [DEBUG] Test client created with ID:", docRef.id)

    return NextResponse.json({
      success: true,
      clientId: docRef.id,
      testClient: {
        ...testClient,
        id: docRef.id,
      },
    })
  } catch (error: any) {
    console.error("💥 [DEBUG] Error creating test client:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
