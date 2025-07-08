#!/usr/bin/env node

console.log("🔥 Testing Firebase Connection...\n")

// Test Firebase client configuration
console.log("📱 Testing Firebase Client Configuration:")
const clientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

const clientErrors = []
Object.entries(clientConfig).forEach(([key, value]) => {
  if (key !== "measurementId" && (!value || value === "undefined")) {
    clientErrors.push(`❌ Missing: ${key}`)
  } else if (value && value !== "undefined") {
    console.log(`✅ ${key}: ${value.substring(0, 20)}...`)
  }
})

if (clientErrors.length > 0) {
  console.log("\n🚨 Client Configuration Errors:")
  clientErrors.forEach((error) => console.log(error))
}

// Test Firebase server configuration
console.log("\n🔒 Testing Firebase Server Configuration:")
const serverConfig = {
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
  privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
  clientId: process.env.FIREBASE_CLIENT_ID,
}

const serverErrors = []
Object.entries(serverConfig).forEach(([key, value]) => {
  if (key === "clientEmail" || key === "privateKey") {
    if (!value || value === "undefined") {
      serverErrors.push(`❌ Missing: ${key}`)
    } else {
      console.log(`✅ ${key}: Present`)
    }
  } else if (value && value !== "undefined") {
    console.log(`✅ ${key}: Present`)
  }
})

if (serverErrors.length > 0) {
  console.log("\n🚨 Server Configuration Errors:")
  serverErrors.forEach((error) => console.log(error))
}

// Test Firebase initialization
console.log("\n🧪 Testing Firebase Initialization:")
try {
  // Simulate Firebase client initialization
  if (clientConfig.apiKey && clientConfig.projectId) {
    console.log("✅ Firebase client config appears valid")
  } else {
    console.log("❌ Firebase client config is incomplete")
  }

  // Simulate Firebase admin initialization
  if (serverConfig.clientEmail && serverConfig.privateKey) {
    console.log("✅ Firebase admin config appears valid")

    // Check private key format
    if (serverConfig.privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
      console.log("✅ Private key format is correct")
    } else {
      console.log("❌ Private key format is incorrect - should contain '-----BEGIN PRIVATE KEY-----'")
    }
  } else {
    console.log("❌ Firebase admin config is incomplete")
  }
} catch (error) {
  console.log("❌ Firebase initialization test failed:", error.message)
}

// Summary
console.log("\n📊 Summary:")
const totalErrors = clientErrors.length + serverErrors.length
if (totalErrors === 0) {
  console.log("✅ All Firebase configuration appears correct")
} else {
  console.log(`❌ Found ${totalErrors} configuration issues that need to be fixed`)
  console.log("\n🔧 To fix these issues:")
  console.log("1. Go to your Vercel dashboard")
  console.log("2. Navigate to your project settings")
  console.log("3. Go to Environment Variables")
  console.log("4. Add the missing variables listed above")
  console.log("5. Redeploy your application")
}

console.log("\n🚨 IMPORTANT NOTE:")
console.log("Based on your Vercel logs, the actual error is:")
console.log("'TypeError: (0, c.getUserByEmail) is not a function'")
console.log("This suggests an import/export issue, not environment variables!")
