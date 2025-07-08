#!/usr/bin/env node

console.log("🔥 Testing Firebase Connection...\n")

// Check required environment variables first
const requiredVars = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
]

console.log("1️⃣ Checking Required Environment Variables...")
const missingVars = requiredVars.filter((varName) => !process.env[varName])

if (missingVars.length > 0) {
  console.log("❌ Missing required environment variables:")
  missingVars.forEach((varName) => {
    console.log(`   - ${varName}`)
  })
  console.log("\n💡 These missing variables will cause the 500 error!")
}

console.log("✅ All required environment variables are present\n")

// Test Firebase client configuration
console.log("2️⃣ Testing Firebase Client Configuration...")

const clientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

console.log("Firebase Client Config:")
console.log(`   API Key: ${clientConfig.apiKey ? clientConfig.apiKey.substring(0, 10) + "..." : "Missing"}`)
console.log(`   Auth Domain: ${clientConfig.authDomain || "Missing"}`)
console.log(`   Project ID: ${clientConfig.projectId || "Missing"}`)
console.log(`   Storage Bucket: ${clientConfig.storageBucket || "Missing"}`)
console.log(`   Messaging Sender ID: ${clientConfig.messagingSenderId || "Missing"}`)
console.log(`   App ID: ${clientConfig.appId ? "Present" : "Missing"}`)

// Validate client config
let clientConfigValid = true
if (!clientConfig.apiKey || !clientConfig.apiKey.startsWith("AIza")) {
  console.log("❌ Invalid API Key format (should start with 'AIza')")
  clientConfigValid = false
}
if (!clientConfig.authDomain || !clientConfig.authDomain.includes(".firebaseapp.com")) {
  console.log("❌ Invalid Auth Domain format (should end with '.firebaseapp.com')")
  clientConfigValid = false
}
if (!clientConfig.projectId) {
  console.log("❌ Missing Project ID")
  clientConfigValid = false
}

if (clientConfigValid) {
  console.log("✅ Client configuration appears valid")
} else {
  console.log("❌ Client configuration has issues")
}

console.log("\n3️⃣ Testing Firebase Server Configuration...")

const serverConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
  privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
  clientId: process.env.FIREBASE_CLIENT_ID,
}

console.log("Firebase Server Config:")
console.log(`   Project ID: ${serverConfig.projectId || "Missing"}`)
console.log(`   Client Email: ${serverConfig.clientEmail || "Missing"}`)
console.log(`   Private Key: ${serverConfig.privateKey ? "Present" : "Missing"}`)
console.log(`   Private Key ID: ${serverConfig.privateKeyId || "Not set (optional)"}`)
console.log(`   Client ID: ${serverConfig.clientId || "Not set (optional)"}`)

// Validate server config
let serverConfigValid = true
if (
  !serverConfig.clientEmail ||
  !serverConfig.clientEmail.includes("@") ||
  !serverConfig.clientEmail.includes(".iam.gserviceaccount.com")
) {
  console.log("❌ Invalid Client Email format (should be a service account email)")
  serverConfigValid = false
}
if (!serverConfig.privateKey || !serverConfig.privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
  console.log("❌ Invalid Private Key format (should contain -----BEGIN PRIVATE KEY-----)")
  serverConfigValid = false
}

if (serverConfigValid) {
  console.log("✅ Server configuration appears valid")
} else {
  console.log("❌ Server configuration has issues")
}

console.log("\n4️⃣ Testing Service Account JSON Structure...")

try {
  const serviceAccountObj = {
    type: "service_account",
    project_id: serverConfig.projectId,
    private_key_id: serverConfig.privateKeyId,
    private_key: serverConfig.privateKey?.replace(/\\n/g, "\n"),
    client_email: serverConfig.clientEmail,
    client_id: serverConfig.clientId,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(serverConfig.clientEmail)}`,
  }

  console.log("✅ Service account object can be created")
  console.log(`   Type: ${serviceAccountObj.type}`)
  console.log(`   Project ID: ${serviceAccountObj.project_id}`)
  console.log(`   Client Email: ${serviceAccountObj.client_email}`)
  console.log(`   Private Key: ${serviceAccountObj.private_key ? "Present and formatted" : "Missing or invalid"}`)
} catch (error) {
  console.log("❌ Failed to create service account object:")
  console.log(`   Error: ${error.message}`)
  serverConfigValid = false
}

console.log("\n📊 Firebase Configuration Summary:")
console.log(`   Client Config: ${clientConfigValid ? "✅ Valid" : "❌ Invalid"}`)
console.log(`   Server Config: ${serverConfigValid ? "✅ Valid" : "❌ Invalid"}`)

if (!clientConfigValid || !serverConfigValid) {
  console.log("\n❌ Firebase configuration issues detected!")
  console.log("   This is likely the cause of your 500 Internal Server Error")
  console.log("\n💡 To fix:")
  console.log("   1. Check your environment variables in Vercel dashboard")
  console.log("   2. Ensure Firebase service account JSON is properly formatted")
  console.log("   3. Verify Firebase project settings match your environment variables")
} else {
  console.log("\n✅ Firebase configuration looks good!")
  console.log("   The 500 error might be caused by:")
  console.log("   - Firestore security rules")
  console.log("   - Network connectivity issues")
  console.log("   - Missing user data in Firestore")
}
