import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/firebase/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

export async function POST() {
  try {
    console.log("[DEBUG] Creating test client...")

    // Get user ID from cookie
    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "No user ID found in cookies",
        },
        { status: 401 },
      )
    }

    console.log("[DEBUG] Creating test client for user:", userId)

    // Create test client data
    const testClientData = {
      name: `Test Client ${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      phone: "123-456-7890",
      status: "Active",
      progress: 50,
      sessions: { completed: 5, total: 10 },
      completion: 50,
      notes: "This is a test client created by the debug endpoint",
      goal: "Test fitness goal",
      program: "Test program",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    // Add to Firestore
    const clientsRef = collection(db, "users", userId, "clients")
    const docRef = await addDoc(clientsRef, testClientData)

    console.log("[DEBUG] Test client created with ID:", docRef.id)

    return NextResponse.json({
      success: true,
      clientId: docRef.id,
      message: "Test client created successfully",
    })
  } catch (error) {
    console.error("[DEBUG] Error creating test client:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
