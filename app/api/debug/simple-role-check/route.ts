import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[DEBUG] Starting Firestore connectivity test...")

    // Test 1: Check if Firebase is initialized
    let firebaseStatus = "❌ Not initialized"
    let dbStatus = "❌ Not available"
    let authStatus = "❌ Not available"

    try {
      const { db } = await import("@/lib/firebase/firebase")
      const { auth } = await import("@/lib/firebase/firebase")

      if (db) {
        dbStatus = "✅ Database instance available"
        console.log("[DEBUG] Firestore database instance found")
      }

      if (auth) {
        authStatus = "✅ Auth instance available"
        console.log("[DEBUG] Firebase auth instance found")
      }

      firebaseStatus = "✅ Firebase initialized"
    } catch (firebaseError: any) {
      console.error("[DEBUG] Firebase initialization error:", firebaseError)
      return NextResponse.json({
        error: "Firebase initialization failed",
        details: firebaseError.message,
        firebaseStatus,
        dbStatus,
        authStatus,
      })
    }

    // Test 2: Try a simple Firestore read operation
    let firestoreTest = "❌ Failed"
    let userQueryTest = "❌ Failed"
    let userData = null

    try {
      const { db } = await import("@/lib/firebase/firebase")
      const { collection, getDocs, query, limit } = await import("firebase/firestore")

      console.log("[DEBUG] Testing Firestore connectivity...")

      // Try to read from users collection
      const usersRef = collection(db, "users")
      const testQuery = query(usersRef, limit(1))
      const snapshot = await getDocs(testQuery)

      firestoreTest = "✅ Firestore read successful"
      console.log("[DEBUG] Firestore read test passed")

      // Test specific user query
      const { query: firestoreQuery, where } = await import("firebase/firestore")
      const userQuery = firestoreQuery(usersRef, where("email", "==", "mirresnelting+4@gmail.com"))
      const userSnapshot = await getDocs(userQuery)

      if (!userSnapshot.empty) {
        userQueryTest = "✅ User found"
        const userDoc = userSnapshot.docs[0]
        userData = {
          id: userDoc.id,
          email: userDoc.data().email,
          role: userDoc.data().role,
          user_type: userDoc.data().user_type,
          name: userDoc.data().name,
          hasFirebaseAuth: userDoc.data().hasFirebaseAuth,
        }
        console.log("[DEBUG] User data found:", userData)
      } else {
        userQueryTest = "⚠️ User not found"
        console.log("[DEBUG] No user found with email mirresnelting+4@gmail.com")
      }
    } catch (firestoreError: any) {
      console.error("[DEBUG] Firestore operation error:", firestoreError)
      firestoreTest = `❌ Error: ${firestoreError.message}`
    }

    // Test 3: Check environment variables
    const envCheck = {
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "✅ Present" : "❌ Missing",
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "✅ Present" : "❌ Missing",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "✅ Present" : "❌ Missing",
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? "✅ Present" : "❌ Missing",
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? "✅ Present" : "❌ Missing",
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      tests: {
        firebaseStatus,
        dbStatus,
        authStatus,
        firestoreTest,
        userQueryTest,
      },
      userData,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL === "1" ? "✅ Running on Vercel" : "❌ Not on Vercel",
        variables: envCheck,
      },
      projectInfo: {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      },
    })
  } catch (error: any) {
    console.error("[DEBUG] Diagnostic test failed:", error)
    return NextResponse.json(
      {
        error: "Diagnostic test failed",
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
