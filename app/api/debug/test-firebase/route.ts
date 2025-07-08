import { NextResponse } from "next/server"
import { auth } from "@/lib/firebase/firebase"
import { getUserByEmail } from "@/lib/firebase/user-service"

export async function GET() {
  try {
    // Test Firebase initialization
    console.log("[API:test-firebase] Testing Firebase initialization...")
    const currentUser = auth.currentUser
    console.log("[API:test-firebase] Firebase initialized successfully")

    // Test Firestore connection by getting a test user
    console.log("[API:test-firebase] Testing Firestore connection...")
    const testUser = await getUserByEmail("test@example.com")
    console.log("[API:test-firebase] Firestore query executed")

    return NextResponse.json({
      status: "success",
      message: "Firebase connection test successful",
      firebaseInitialized: true,
      firestoreConnected: true,
      testUserExists: !!testUser,
    })
  } catch (error: any) {
    console.error("[API:test-firebase] Error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Firebase connection test failed",
        error: error.message,
        errorCode: error.code,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
