export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    console.log("🧪 [TEST] Creating test client...")

    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Import Firebase functions
    const { db } = await import("@/lib/firebase/firebase")
    const { collection, addDoc, serverTimestamp } = await import("firebase/firestore")

    // Create test client data
    const testClientData = {
      name: "Test Client " + Date.now(),
      email: "test@example.com",
      status: "Active",
      progress: 50,
      sessions: { completed: 2, total: 5 },
      completion: 40,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isTemporary: false,
      notes: "Test client created for debugging",
    }

    console.log("🧪 [TEST] Test client data:", testClientData)

    // Try creating in the user's clients subcollection
    const clientsCollectionRef = collection(db, "users", userId, "clients")
    console.log(`🧪 [TEST] Creating in: users/${userId}/clients`)

    const newClientRef = await addDoc(clientsCollectionRef, testClientData)
    console.log("✅ [TEST] Test client created with ID:", newClientRef.id)

    return NextResponse.json({
      success: true,
      message: "Test client created successfully",
      clientId: newClientRef.id,
      path: `users/${userId}/clients/${newClientRef.id}`,
    })
  } catch (error: any) {
    console.error("💥 [TEST] Error creating test client:", error)
    return NextResponse.json(
      {
        error: "Test client creation failed",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}
