import { NextResponse } from "next/server"

export async function GET() {
  const timestamp = new Date().toISOString()

  // Check environment variables
  const envCheck = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL === "1",
    hasFirebaseConfig: !!(
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ),
    hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
    hasEncryptionKey: !!process.env.ENCRYPTION_KEY,
  }

  // Test Firebase initialization
  let firebaseStatus = "unknown"
  try {
    const { auth } = await import("@/lib/firebase/firebase")
    if (auth && auth.app) {
      firebaseStatus = "initialized"
    } else {
      firebaseStatus = "not_initialized"
    }
  } catch (error: any) {
    firebaseStatus = `error: ${error.message}`
  }

  // Test getUserByEmail function
  let userServiceStatus = "unknown"
  try {
    const { getUserByEmail } = await import("@/lib/firebase/user-service")
    if (typeof getUserByEmail === "function") {
      userServiceStatus = "available"
    } else {
      userServiceStatus = "not_function"
    }
  } catch (error: any) {
    userServiceStatus = `error: ${error.message}`
  }

  const healthData = {
    status: "ok",
    timestamp,
    environment: envCheck,
    services: {
      firebase: firebaseStatus,
      userService: userServiceStatus,
    },
    version: process.env.npm_package_version || "unknown",
  }

  return NextResponse.json(healthData, {
    status: 200,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  })
}

export async function POST() {
  return NextResponse.json({ message: "Health check endpoint - use GET method" }, { status: 405 })
}
