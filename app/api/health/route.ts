import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check for required environment variables
    const envVars = {
      // Firebase Client-side variables
      NEXT_PUBLIC_FIREBASE_API_KEY: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      NEXT_PUBLIC_FIREBASE_APP_ID: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,

      // Firebase Server-side variables
      FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
      FIREBASE_PRIVATE_KEY_ID: !!process.env.FIREBASE_PRIVATE_KEY_ID,
      FIREBASE_CLIENT_ID: !!process.env.FIREBASE_CLIENT_ID,

      // Google Auth variables
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,

      // App variables
      NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,

      // Security variables
      ENCRYPTION_KEY: !!process.env.ENCRYPTION_KEY,

      // Stripe variables
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,

      // Blob storage
      BLOB_READ_WRITE_TOKEN: !!process.env.BLOB_READ_WRITE_TOKEN,
    }

    // Check Firebase private key format
    let firebasePrivateKeyValid = false
    if (process.env.FIREBASE_PRIVATE_KEY) {
      firebasePrivateKeyValid = process.env.FIREBASE_PRIVATE_KEY.includes("PRIVATE KEY")
    }

    // Basic Firebase project ID validation
    let firebaseProjectIdValid = false
    if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      firebaseProjectIdValid = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID.length > 0
    }

    // Check if we're in a Vercel environment
    const isVercel = process.env.VERCEL === "1"

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "unknown",
      isVercel,
      envVarsPresent: envVars,
      firebaseChecks: {
        privateKeyValid: firebasePrivateKeyValid,
        projectIdValid: firebaseProjectIdValid,
      },
    })
  } catch (error: any) {
    console.error("[API:health] Health check error:", error)
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      { status: 500 },
    )
  }
}
