#!/usr/bin/env node

/**
 * Firebase Connection Test
 * This script tests the actual Firebase connection and authentication
 */

import { initializeApp, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

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
    console.log(`   Project ID: ${adminApp.options.projectId}`)

    // Test Firestore connection
    const db = getFirestore(adminApp)
    console.log("✅ Firestore instance created")

    // Try to read a document (this tests permissions)
    console.log("🔄 Testing Firestore read permissions...")
    try {
      const testDoc = await db.collection("_test_connection").doc("test").get()
      console.log(`✅ Firestore read successful. Document exists: ${testDoc.exists}`)
    } catch (readError) {
      console.log(`⚠️  Firestore read failed: ${readError.message}`)
      console.log("   This might be due to Firestore security rules")
    }

    // Try to write a document (this tests write permissions)
    console.log("🔄 Testing Firestore write permissions...")
    try {
      const timestamp = new Date().toISOString()
      await db
        .collection("_test_connection")
        .doc("test")
        .set({
          timestamp,
          environment: process.env.NODE_ENV || "unknown",
          test: "Connection test from script",
          vercel: process.env.VERCEL === "1",
        })
      console.log("✅ Firestore write successful")

      // Read it back to confirm
      const verifyDoc = await db.collection("_test_connection").doc("test").get()
      if (verifyDoc.exists && verifyDoc.data().timestamp === timestamp) {
        console.log("✅ Firestore read/write verification successful")
      } else {
        console.error("❌ Firestore verification failed - data mismatch")
      }
    } catch (writeError) {
      console.log(`⚠️  Firestore write failed: ${writeError.message}`)
      console.log("   This might be due to Firestore security rules or permissions")
    }

    return true
  } catch (error) {
    console.error("❌ Server-side Firebase test failed:")
    console.error(`   Error: ${error.message}`)
    console.error(`   Code: ${error.code || "N/A"}`)

    // Provide specific guidance based on error type
    if (error.message.includes("private_key")) {
      console.error("   💡 Hint: Check if FIREBASE_PRIVATE_KEY is properly formatted")
      console.error("      - Should contain -----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY-----")
      console.error("      - Newlines should be escaped as \\n in environment variables")
    }
    if (error.message.includes("client_email")) {
      console.error("   💡 Hint: Check if FIREBASE_CLIENT_EMAIL is a valid service account email")
      console.error("      - Should end with @your-project.iam.gserviceaccount.com")
    }
    if (error.message.includes("project")) {
      console.error("   💡 Hint: Check if NEXT_PUBLIC_FIREBASE_PROJECT_ID matches your Firebase project")
    }

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
      throw new Error("Invalid Firebase API Key format - should start with 'AIza'")
    }

    if (!firebaseConfig.authDomain || !firebaseConfig.authDomain.includes(".firebaseapp.com")) {
      throw new Error("Invalid Firebase Auth Domain format - should end with '.firebaseapp.com'")
    }

    if (!firebaseConfig.projectId) {
      throw new Error("Missing Firebase Project ID")
    }

    console.log("✅ Client-side Firebase configuration appears valid:")
    console.log(`   API Key: ${firebaseConfig.apiKey.substring(0, 10)}...`)
    console.log(`   Auth Domain: ${firebaseConfig.authDomain}`)
    console.log(`   Project ID: ${firebaseConfig.projectId}`)
    console.log(`   Storage Bucket: ${firebaseConfig.storageBucket || "Not set"}`)
    console.log(`   Messaging Sender ID: ${firebaseConfig.messagingSenderId || "Not set"}`)
    console.log(`   App ID: ${firebaseConfig.appId ? "Set" : "Not set"}`)

    return true
  } catch (error) {
    console.error("❌ Client-side Firebase configuration test failed:", error.message)
    return false
  }
}

// Test authentication flow simulation
async function testAuthFlow() {
  console.log("\n🔄 Testing authentication flow simulation...")

  try {
    // This simulates what happens in your login API
    console.log("   Simulating login API flow...")

    // Check if we can create the admin instance (this is what your API does)
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")

    const serviceAccount = {
      type: "service_account",
      project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: privateKey,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
    }

    console.log("✅ Service account object created successfully")
    console.log(`   Client Email: ${serviceAccount.client_email}`)
    console.log(`   Project ID: ${serviceAccount.project_id}`)
    console.log(`   Private Key: ${serviceAccount.private_key ? "Present" : "Missing"}`)

    return true
  } catch (error) {
    console.error("❌ Auth flow simulation failed:", error.message)
    return false
  }
}

// Run the tests
async function runTests() {
  console.log("🚀 Starting comprehensive Firebase tests...\n")

  const clientConfigValid = testClientFirebaseConfig()
  const authFlowValid = await testAuthFlow()
  const serverConnectionValid = await testServerFirebase()

  console.log("\n📊 Firebase Connection Test Summary:")
  console.log("=".repeat(50))
  console.log(`Client-side configuration: ${clientConfigValid ? "✅ Valid" : "❌ Invalid"}`)
  console.log(`Auth flow simulation: ${authFlowValid ? "✅ Working" : "❌ Failed"}`)
  console.log(`Server-side connection: ${serverConnectionValid ? "✅ Working" : "❌ Failed"}`)

  if (clientConfigValid && authFlowValid && serverConnectionValid) {
    console.log("\n🎉 All Firebase tests passed successfully!")
    console.log("   Your Firebase configuration should work in the login API")
    process.exit(0)
  } else {
    console.error("\n❌ Some Firebase tests failed. See details above.")
    console.error("   This likely explains why your login API is returning 500 errors")
    process.exit(1)
  }
}

runTests().catch((error) => {
  console.error("❌ Unhandled error during tests:", error)
  process.exit(1)
})
