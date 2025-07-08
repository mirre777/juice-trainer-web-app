import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[CONFIG-TEST] Testing Firebase configuration...")

    // Check environment variables
    const envVars = {
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "Present" : "Missing",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? "Present" : "Missing",
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? "Present" : "Missing",
    }

    console.log("[CONFIG-TEST] Environment variables:", envVars)

    // Test Firebase initialization
    let firebaseTest = "❌ Failed"
    let dbTest = "❌ Failed"

    try {
      const { db } = await import("@/lib/firebase/firebase")
      if (db) {
        firebaseTest = "✅ Firebase initialized"
        dbTest = "✅ Database available"
        console.log("[CONFIG-TEST] Firebase initialized successfully")
      }
    } catch (firebaseError: any) {
      console.error("[CONFIG-TEST] Firebase initialization failed:", firebaseError)
      firebaseTest = `❌ Error: ${firebaseError.message}`
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envVars,
      tests: {
        firebaseTest,
        dbTest,
      },
      status: firebaseTest.includes("✅") ? "success" : "failed",
    })
  } catch (error: any) {
    console.error("[CONFIG-TEST] Test failed:", error)
    return NextResponse.json(
      {
        error: "Configuration test failed",
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
