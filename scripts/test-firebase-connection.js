// Script to test Firebase connection and configuration
const { initializeApp, cert } = require("firebase-admin/app")
const { getFirestore } = require("firebase-admin/firestore")

console.log("🔥 Testing Firebase connection...")

// Check if required environment variables are present
const requiredVars = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
]

const missingVars = requiredVars.filter((varName) => !process.env[varName])
if (missingVars.length > 0) {
  console.error("❌ Missing required environment variables:", missingVars.join(", "))
  process.exit(1)
}

// Test server-side Firebase connection
async function testServerFirebase() {
  console.log("\n🔄 Testing server-side Firebase connection...")

  try {
    // Initialize Firebase Admin
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")

    const adminApp = initializeApp(
      {
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      },
      "admin-test",
    )

    console.log("✅ Firebase Admin initialized successfully")

    // Test Firestore connection
    const db = getFirestore(adminApp)
    console.log("✅ Firestore instance created")

    // Try to read a document
    console.log("🔄 Testing Firestore read...")
    const testDoc = await db.collection("_test_connection").doc("test").get()
    console.log(`✅ Firestore read successful. Document exists: ${testDoc.exists}`)

    // Try to write a document
    console.log("🔄 Testing Firestore write...")
    const timestamp = new Date().toISOString()
    await db
      .collection("_test_connection")
      .doc("test")
      .set({
        timestamp,
        environment: process.env.NODE_ENV || "unknown",
        test: "Connection test",
      })
    console.log("✅ Firestore write successful")

    // Read it back to confirm
    const verifyDoc = await db.collection("_test_connection").doc("test").get()
    if (verifyDoc.exists && verifyDoc.data().timestamp === timestamp) {
      console.log("✅ Firestore read/write verification successful")
    } else {
      console.error("❌ Firestore verification failed - data mismatch")
    }

    return true
  } catch (error) {
    console.error("❌ Server-side Firebase test failed:", error)
    console.error(
      "Error details:",
      JSON.stringify(
        {
          code: error.code,
          message: error.message,
          stack: error.stack,
        },
        null,
        2,
      ),
    )
    return false
  }
}

// Test client-side Firebase configuration
function testClientFirebaseConfig() {
  console.log("\n🔄 Testing client-side Firebase configuration...")

  try {
    // Create the config object that would be used client-side
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    }

    // Validate the config
    if (!firebaseConfig.apiKey || !firebaseConfig.apiKey.startsWith("AIza")) {
      throw new Error("Invalid Firebase API Key format")
    }

    if (!firebaseConfig.authDomain || !firebaseConfig.authDomain.includes(".")) {
      throw new Error("Invalid Firebase Auth Domain format")
    }

    if (!firebaseConfig.projectId) {
      throw new Error("Missing Firebase Project ID")
    }

    console.log("✅ Client-side Firebase configuration appears valid:")
    console.log(
      JSON.stringify(
        {
          apiKey: `${firebaseConfig.apiKey.substring(0, 6)}...`,
          authDomain: firebaseConfig.authDomain,
          projectId: firebaseConfig.projectId,
          storageBucket: firebaseConfig.storageBucket,
          messagingSenderId: firebaseConfig.messagingSenderId ? "✓" : "✗",
          appId: firebaseConfig.appId ? "✓" : "✗",
        },
        null,
        2,
      ),
    )

    return true
  } catch (error) {
    console.error("❌ Client-side Firebase configuration test failed:", error)
    return false
  }
}

// Run the tests
async function runTests() {
  const clientConfigValid = testClientFirebaseConfig()
  const serverConnectionValid = await testServerFirebase()

  console.log("\n📊 Firebase Connection Test Summary:")
  console.log(`Client-side configuration: ${clientConfigValid ? "✅ Valid" : "❌ Invalid"}`)
  console.log(`Server-side connection: ${serverConnectionValid ? "✅ Working" : "❌ Failed"}`)

  if (clientConfigValid && serverConnectionValid) {
    console.log("\n🎉 All Firebase tests passed successfully!")
    process.exit(0)
  } else {
    console.error("\n❌ Some Firebase tests failed. See details above.")
    process.exit(1)
  }
}

runTests().catch((error) => {
  console.error("Unhandled error during tests:", error)
  process.exit(1)
})
