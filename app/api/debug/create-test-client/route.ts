export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/firebase/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

export async function POST(request: NextRequest) {
  try {
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

    console.log("[CREATE-TEST-CLIENT] Creating test client for user:", userId)

    // Create a test client with all required fields
    const testClient = {
      name: "Test Client",
      email: "test.client@example.com",
      status: "active",
      phone: "+1234567890",
      notes: "This is a test client created by the debug endpoint",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isTestClient: true, // Flag to identify test clients
    }

    // Add to Firestore
    const clientsRef = collection(db, `users/${userId}/clients`)
    const docRef = await addDoc(clientsRef, testClient)

    console.log("[CREATE-TEST-CLIENT] Test client created with ID:", docRef.id)

    return NextResponse.json({
      success: true,
      clientId: docRef.id,
      message: "Test client created successfully",
      clientData: {
        id: docRef.id,
        ...testClient,
        createdAt: "serverTimestamp()", // Can't serialize serverTimestamp
        updatedAt: "serverTimestamp()",
      },
    })
  } catch (error: any) {
    console.error("[CREATE-TEST-CLIENT] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unknown error",
        stack: error?.stack,
      },
      { status: 500 },
    )
  }
}
