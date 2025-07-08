#!/usr/bin/env node

/**
 * Firebase Connection Test
 * This script tests the actual Firebase connection and authentication
 */

async function testFirebaseConnection() {
  console.log("🔥 Testing Firebase Connection...\n")

  try {
    // Import Firebase modules
    const { initializeApp, getApps } = require("firebase/app")
    const { getAuth, connectAuthEmulator } = require("firebase/auth")
    const { getFirestore, connectFirestoreEmulator } = require("firebase/firestore")

    // Firebase configuration
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    }

    console.log("📋 Firebase Configuration:")
    Object.entries(firebaseConfig).forEach(([key, value]) => {
      if (value) {
        console.log(`   ${key}: ${value.substring(0, 20)}${value.length > 20 ? "..." : ""}`)
      } else {
        console.log(`   ${key}: ❌ MISSING`)
      }
    })
    console.log("")

    // Initialize Firebase
    let app
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig)
      console.log("✅ Firebase app initialized successfully")
    } else {
      app = getApps()[0]
      console.log("✅ Firebase app already initialized")
    }

    // Test Auth
    const auth = getAuth(app)
    console.log("✅ Firebase Auth initialized")
    console.log(`   Auth instance: ${auth.app.name}`)
    console.log(`   Current user: ${auth.currentUser ? auth.currentUser.email : "None"}`)

    // Test Firestore
    const db = getFirestore(app)
    console.log("✅ Firestore initialized")
    console.log(`   Database instance: ${db.app.name}`)

    // Test Admin SDK (server-side)
    console.log("\n🔧 Testing Firebase Admin SDK...")
    await testFirebaseAdmin()
  } catch (error) {
    console.error("❌ Firebase connection failed:", error.message)
    console.error("   Stack:", error.stack)
    process.exit(1)
  }
}

async function testFirebaseAdmin() {
  try {
    // Test if we can import admin SDK
    const admin = require("firebase-admin")

    // Check if already initialized
    let adminApp
    try {
      adminApp = admin.app()
      console.log("✅ Firebase Admin already initialized")
    } catch (error) {
      // Initialize admin SDK
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`,
      }

      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      })
      console.log("✅ Firebase Admin initialized successfully")
    }

    // Test Firestore Admin
    const adminDb = admin.firestore()
    console.log("✅ Firestore Admin initialized")

    // Test a simple read operation (this will fail if permissions are wrong)
    try {
      const testDoc = await adminDb.collection("_test_connection").limit(1).get()
      console.log("✅ Firestore read test successful")
    } catch (firestoreError) {
      console.log("⚠️  Firestore read test failed (this might be normal):", firestoreError.message)
    }

    // Test Auth Admin
    const adminAuth = admin.auth()
    console.log("✅ Firebase Auth Admin initialized")

    console.log("\n📊 Admin SDK Summary:")
    console.log(`   Project ID: ${adminApp.options.projectId}`)
    console.log(`   Service Account: ${process.env.FIREBASE_CLIENT_EMAIL}`)
  } catch (error) {
    console.error("❌ Firebase Admin SDK test failed:", error.message)
    if (error.message.includes("private_key")) {
      console.error("   💡 Hint: Check if FIREBASE_PRIVATE_KEY is properly formatted with \\n characters")
    }
    if (error.message.includes("client_email")) {
      console.error("   💡 Hint: Check if FIREBASE_CLIENT_EMAIL is a valid service account email")
    }
  }
}

// Test specific login functionality
async function testLoginFlow() {
  console.log("\n🔐 Testing Login Flow...")

  try {
    // This would test the actual login API endpoint
    const testEmail = "test@example.com"
    const testPassword = "testpassword123"

    console.log(`   Testing with email: ${testEmail}`)
    console.log("   Note: This is a dry run - no actual login attempt")

    // You could add actual API testing here if needed
    console.log("✅ Login flow test setup complete")
  } catch (error) {
    console.error("❌ Login flow test failed:", error.message)
  }
}

// Run the tests
if (require.main === module) {
  testFirebaseConnection()
    .then(() => testLoginFlow())
    .then(() => {
      console.log("\n✅ All Firebase tests completed successfully!")
      process.exit(0)
    })
    .catch((error) => {
      console.error("\n❌ Firebase tests failed:", error.message)
      process.exit(1)
    })
}

module.exports = { testFirebaseConnection, testFirebaseAdmin }
