import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Basic health check
    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL,
      vercelEnv: process.env.VERCEL_ENV,
      checks: {
        firebase: {
          apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          authDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          serviceAccount: !!process.env.FIREBASE_CLIENT_EMAIL && !!process.env.FIREBASE_PRIVATE_KEY,
        },
        google: {
          clientId: !!process.env.GOOGLE_CLIENT_ID,
          clientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        },
        stripe: {
          secretKey: !!process.env.STRIPE_SECRET_KEY,
          webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
        },
        app: {
          appUrl: !!process.env.NEXT_PUBLIC_APP_URL,
          encryptionKey: !!process.env.ENCRYPTION_KEY,
        },
      },
    }

    return NextResponse.json(health)
  } catch (error) {
    console.error("[API:health] Error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Health check failed",
        error: error.message,
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  // Allow POST requests for testing
  return GET()
}
