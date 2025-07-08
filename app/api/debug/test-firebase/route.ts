import { NextResponse } from "next/server"

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: [],
  }

  // Test 1: Environment Variables
  results.tests.push({
    name: "Environment Variables",
    status: "running",
    details: {
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "present" : "missing",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "missing",
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? "present" : "missing",
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? "present" : "missing",
    },
  })

  // Test 2: Firebase Client Initialization
  try {
    const { auth } = await import("@/lib/firebase/firebase")
    results.tests.push({
      name: "Firebase Client Initialization",
      status: "success",
      details: {
        hasAuth: !!auth,
        projectId: auth?.app?.options?.projectId || "unknown",
        authDomain: auth?.app?.options?.authDomain || "unknown",
      },
    })
  } catch (error: any) {
    results.tests.push({
      name: "Firebase Client Initialization",
      status: "error",
      error: error.message,
      stack: error.stack,
    })
  }

  // Test 3: getUserByEmail Function
  try {
    const { getUserByEmail } = await import("@/lib/firebase/user-service")

    if (typeof getUserByEmail === "function") {
      results.tests.push({
        name: "getUserByEmail Function Import",
        status: "success",
        details: {
          type: typeof getUserByEmail,
          available: true,
        },
      })

      // Test with a non-existent email to avoid exposing real user data
      try {
        const testResult = await getUserByEmail("nonexistent@test.com")
        results.tests.push({
          name: "getUserByEmail Function Execution",
          status: "success",
          details: {
            result: testResult === null ? "null (expected for non-existent user)" : "unexpected result",
            executedSuccessfully: true,
          },
        })
      } catch (execError: any) {
        results.tests.push({
          name: "getUserByEmail Function Execution",
          status: "error",
          error: execError.message,
          code: execError.code,
        })
      }
    } else {
      results.tests.push({
        name: "getUserByEmail Function Import",
        status: "error",
        error: "getUserByEmail is not a function",
        type: typeof getUserByEmail,
      })
    }
  } catch (error: any) {
    results.tests.push({
      name: "getUserByEmail Function Import",
      status: "error",
      error: error.message,
      stack: error.stack,
    })
  }

  // Test 4: Firestore Admin Connection
  try {
    // Try to import and test admin Firestore
    const admin = await import("firebase-admin")

    let adminApp
    if (admin.getApps().length === 0) {
      adminApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
          privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
        }),
      })
    } else {
      adminApp = admin.getApps()[0]
    }

    const adminDb = admin.getFirestore(adminApp)

    // Test a simple read operation
    const testDoc = await adminDb.collection("users").limit(1).get()

    results.tests.push({
      name: "Firestore Admin Connection",
      status: "success",
      details: {
        hasAdminApp: !!adminApp,
        hasAdminDb: !!adminDb,
        canQuery: true,
        docsFound: testDoc.size,
      },
    })
  } catch (error: any) {
    results.tests.push({
      name: "Firestore Admin Connection",
      status: "error",
      error: error.message,
      code: error.code,
    })
  }

  // Determine overall status
  const hasErrors = results.tests.some((test: any) => test.status === "error")
  results.overallStatus = hasErrors ? "error" : "success"

  return NextResponse.json(results, {
    status: hasErrors ? 500 : 200,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  })
}
