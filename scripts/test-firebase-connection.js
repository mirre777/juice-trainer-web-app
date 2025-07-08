#!/usr/bin/env node

import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { initializeApp as initializeAdminApp, cert, getApps } from "firebase-admin/app"
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore"

console.log("🔥 Testing Firebase Connection...\n")

// Test 1: Client-side Firebase Configuration
console.log("1️⃣ Testing Client-side Firebase Configuration...")

const clientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

console.log("Client Config:", {
  ...clientConfig,
  apiKey: clientConfig.apiKey ? `${clientConfig.apiKey.substring(0, 10)}...` : "Missing",
})

try {
  const app = initializeApp(clientConfig)
  console.log("✅ Client Firebase app initialized successfully")
  console.log(`   Project ID: ${app.options.projectId}`)
  console.log(`   Auth Domain: ${app.options.authDomain}`)

  // Test Auth
  const auth = getAuth(app)
  console.log("✅ Firebase Auth initialized")

  // Test Firestore
  const db = getFirestore(app)
  console.log("✅ Firestore initialized")
} catch (error) {
  console.log("❌ Client Firebase initialization failed:")
  console.log(`   Error: ${error.message}`)
  console.log(`   Code: ${error.code || "N/A"}`)
}

console.log("\n2️⃣ Testing Server-side Firebase Admin Configuration...")

// Test 2: Server-side Firebase Admin Configuration
const adminConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
  clientId: process.env.FIREBASE_CLIENT_ID,
}

console.log("Admin Config:", {
  projectId: adminConfig.projectId,
  clientEmail: adminConfig.clientEmail,
  privateKey: adminConfig.privateKey ? "Present" : "Missing",
  privateKeyId: adminConfig.privateKeyId || "Not set",
  clientId: adminConfig.clientId || "Not set",
})

try {
  // Check if admin app already exists
  const existingApps = getApps()
  let adminApp

  if (existingApps.length > 0) {
    adminApp = existingApps[0]
    console.log("✅ Using existing Firebase Admin app")
  } else {
    adminApp = initializeAdminApp({
      credential: cert({
        projectId: adminConfig.projectId,
        clientEmail: adminConfig.clientEmail,
        privateKey: adminConfig.privateKey,
      }),
      projectId: adminConfig.projectId,
    })
    console.log("✅ Firebase Admin app initialized successfully")
  }

  // Test Admin Firestore
  const adminDb = getAdminFirestore(adminApp)
  console.log("✅ Admin Firestore initialized")

  // Test basic Firestore operations
  console.log("\n3️⃣ Testing Firestore Operations...")

  const testDocRef = adminDb.collection("test").doc("connection-test")

  // Write test
  await testDocRef.set({
    timestamp: new Date(),
    test: "Firebase connection test",
    success: true,
  })
  console.log("✅ Firestore write operation successful")

  // Read test
  const testDoc = await testDocRef.get()
  if (testDoc.exists) {
    console.log("✅ Firestore read operation successful")
    console.log(`   Data: ${JSON.stringify(testDoc.data())}`)
  } else {
    console.log("❌ Firestore read operation failed - document not found")
  }

  // Cleanup
  await testDocRef.delete()
  console.log("✅ Firestore delete operation successful")
} catch (error) {
  console.log("❌ Server Firebase Admin initialization failed:")
  console.log(`   Error: ${error.message}`)
  console.log(`   Code: ${error.code || "N/A"}`)

  if (error.message.includes("private_key")) {
    console.log("   💡 Hint: Check that FIREBASE_PRIVATE_KEY is properly formatted")
  }
  if (error.message.includes("client_email")) {
    console.log("   💡 Hint: Check that FIREBASE_CLIENT_EMAIL is a valid service account email")
  }
}

// Test 3: Test getUserByEmail function
console.log("\n4️⃣ Testing getUserByEmail Function...")

try {
  // Import the function from your service
  const { getUserByEmail } = await import("../lib/firebase/user-service.ts")

  // Test with a known email (you can change this)
  const testEmail = "mirresnelting+4@gmail.com"
  console.log(`Testing getUserByEmail with: ${testEmail}`)

  const user = await getUserByEmail(testEmail)

  if (user) {
    console.log("✅ getUserByEmail function works")
    console.log(`   Found user: ${user.email}`)
    console.log(`   User ID: ${user.id}`)
    console.log(`   Has Firebase Auth: ${user.hasFirebaseAuth || false}`)
  } else {
    console.log("⚠️  getUserByEmail returned null - user not found")
  }
} catch (error) {
  console.log("❌ getUserByEmail function failed:")
  console.log(`   Error: ${error.message}`)
  console.log(`   Stack: ${error.stack}`)
}

console.log("\n🏁 Firebase Connection Test Complete")
