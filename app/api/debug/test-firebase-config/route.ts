import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[CONFIG-TEST] Testing Firebase configuration...")

    // Check all required environment variables
    const requiredEnvVars = {
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    }

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key)

    if (missingVars.length > 0) {
      return NextResponse.json({
        status: "❌ Configuration Error",
        error: "Missing required environment variables",
        missingVariables: missingVars,
        allVariables: Object.keys(requiredEnvVars).reduce(
          (acc, key) => {
            acc[key] = requiredEnvVars[key as keyof typeof requiredEnvVars] ? "✅ Present" : "❌ Missing"
            return acc
          },
          {} as Record<string, string>,
        ),
      })
    }

    // Test Firebase initialization
    try {
      const { initializeApp, getApps } = await import("firebase/app")
      const { getFirestore, connectFirestoreEmulator } = await import("firebase/firestore")
      const { getAuth } = await import("firebase/auth")

      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      }

      console.log("[CONFIG-TEST] Firebase config:", {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
        hasApiKey: !!firebaseConfig.apiKey,
      })

      // Initialize Firebase if not already initialized
      let app
      if (getApps().length === 0) {
        app = initializeApp(firebaseConfig)
        console.log("[CONFIG-TEST] Firebase app initialized")
      } else {
        app = getApps()[0]
        console.log("[CONFIG-TEST] Using existing Firebase app")
      }

      const db = getFirestore(app)
      const auth = getAuth(app)

      console.log("[CONFIG-TEST] Firebase services initialized successfully")

      return NextResponse.json({
        status: "✅ Configuration Valid",
        firebase: {
          projectId: firebaseConfig.projectId,
          authDomain: firebaseConfig.authDomain,
          appInitialized: !!app,
          firestoreInitialized: !!db,
          authInitialized: !!auth,
        },
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      })
    } catch (initError: any) {
      console.error("[CONFIG-TEST] Firebase initialization error:", initError)
      return NextResponse.json(
        {
          status: "❌ Initialization Error",
          error: initError.message,
          code: initError.code,
          stack: initError.stack,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("[CONFIG-TEST] Configuration test failed:", error)
    return NextResponse.json(
      {
        status: "❌ Test Failed",
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
