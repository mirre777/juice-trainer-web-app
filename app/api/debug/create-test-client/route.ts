import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/firebase/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

export async function POST(request: NextRequest) {
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
      name: "Test Client",
      email: "test@example.com",
      phone: "+1234567890",
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      notes: "This is a test client created by the debug endpoint",
      goals: ["Test goal 1", "Test goal 2"],
      isTestClient: true, // Flag to identify test clients
    }

    // Add to Firestore
    const collectionPath = `users/${userId}/clients`
    const clientsRef = collection(db, collectionPath)
    const docRef = await addDoc(clientsRef, testClientData)

    console.log("[DEBUG] Test client created with ID:", docRef.id)

    return NextResponse.json({
      success: true,
      message: "Test client created successfully",
      clientId: docRef.id,
      clientData: {
        ...testClientData,
        id: docRef.id,
      },
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
