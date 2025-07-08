import { NextResponse } from "next/server"

export async function GET() {
  try {
    const healthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercel: process.env.VERCEL === "1",
        vercelEnv: process.env.VERCEL_ENV,
      },
      firebase: {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "✓" : "✗",
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "✓" : "✗",
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "✓" : "✗",
        serviceAccount: process.env.FIREBASE_CLIENT_EMAIL ? "✓" : "✗",
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? "✓" : "✗",
      },
      auth: {
        googleClientId: process.env.GOOGLE_CLIENT_ID ? "✓" : "✗",
        googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? "✓" : "✗",
        encryptionKey: process.env.ENCRYPTION_KEY ? "✓" : "✗",
      },
      stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY ? "✓" : "✗",
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? "✓" : "✗",
      },
    }

    return NextResponse.json(healthData)
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  return NextResponse.json({ message: "Health check endpoint - use GET method" }, { status: 405 })
}
