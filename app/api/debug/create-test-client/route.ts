export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

export async function POST() {
  try {
    console.log("🧪 [DEBUG] Creating test client")

    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const testClientData = {
      name: "Test Client " + Date.now(),
      email: "test@example.com",
      status: "Active",
      progress: 50,
      sessions: { completed: 5, total: 10 },
      completion: 50,
      notes: "This is a test client",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const clientsCollectionRef = collection(db, "users", userId, "clients")
    const docRef = await addDoc(clientsCollectionRef, testClientData)

    console.log("✅ [DEBUG] Test client created with ID:", docRef.id)

    return NextResponse.json({
      success: true,
      clientId: docRef.id,
      path: `users/${userId}/clients/${docRef.id}`,
      data: testClientData,
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
