import { NextResponse } from "next/server"
import { auth } from "@/lib/firebase/firebase"

export async function GET() {
  try {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      vercel: process.env.VERCEL === "1",

      // Firebase Client Configuration
      clientConfig: {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "Present" : "Missing",
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "Missing",
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "Missing",
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "Missing",
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? "Present" : "Missing",
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? "Present" : "Missing",
      },

      // Firebase Server Configuration
      serverConfig: {
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? "Present" : "Missing",
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? "Present" : "Missing",
        privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID ? "Present" : "Missing",
        clientId: process.env.FIREBASE_CLIENT_ID ? "Present" : "Missing",
      },

      // Firebase Auth Instance Test
      authInstance: {
        available: !!auth,
        projectId: auth?.app?.options?.projectId || "Not available",
        currentUser: auth?.currentUser ? "User logged in" : "No user",
      },
    }

    // Test Firebase Auth initialization
    try {
      if (auth && auth.app) {
        debugInfo.authInstance.status = "✅ Initialized"
        debugInfo.authInstance.appName = auth.app.name
      } else {
        debugInfo.authInstance.status = "❌ Not initialized"
      }
    } catch (authError: any) {
      debugInfo.authInstance.status = "❌ Error"
      debugInfo.authInstance.error = authError.message
    }

    return NextResponse.json(debugInfo)
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Debug endpoint failed",
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
