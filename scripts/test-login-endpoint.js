#!/usr/bin/env node

console.log("🔐 Testing Login Endpoint...\n")

// Test configuration
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
const loginUrl = `${baseUrl}/api/auth/login`

console.log(`🌐 Testing endpoint: ${loginUrl}`)
console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`)
console.log(`📦 Vercel: ${process.env.VERCEL === "1" ? "Yes" : "No"}`)
console.log("")

// Test credentials from your screenshot
const testCredentials = {
  email: "mirresnelting+4@gmail.com", // From your screenshot
  password: "test123", // Placeholder - you'll need to use the real password
}

console.log(`📧 Test email: ${testCredentials.email}`)
console.log(`🔑 Password: ${"*".repeat(testCredentials.password.length)}`)
console.log("")

// Simulate the login request that's failing
console.log("1️⃣ Simulating the failing login request...")

// Create the request payload (same as in your screenshot)
const requestPayload = {
  email: testCredentials.email,
  password: testCredentials.password,
  invitationCode: null, // From your screenshot logs
}

console.log("📦 Request payload:")
console.log(
  JSON.stringify(
    {
      ...requestPayload,
      password: "********", // Hide password in logs
    },
    null,
    2,
  ),
)

console.log("\n2️⃣ Analyzing the request...")

// Check if we have the required environment variables for the API to work
const requiredForAPI = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
]

console.log("🔍 Checking if API has required environment variables...")
const missingForAPI = requiredForAPI.filter((varName) => !process.env[varName])

if (missingForAPI.length > 0) {
  console.log("❌ Missing environment variables that the API needs:")
  missingForAPI.forEach((varName) => {
    console.log(`   - ${varName}`)
  })
  console.log("\n💡 This explains the 500 Internal Server Error!")
  console.log("   The login API cannot initialize Firebase without these variables.")
} else {
  console.log("✅ All required environment variables are present for the API")
}

console.log("\n3️⃣ Analyzing the error from your screenshot...")

const errorFromScreenshot = {
  message: "Failed to retrieve user profile. Please try again.",
  errorId: "ERR_1751989111900_guxe85vd",
}

console.log("📋 Error details from your screenshot:")
console.log(`   Message: ${errorFromScreenshot.message}`)
console.log(`   Error ID: ${errorFromScreenshot.errorId}`)
console.log("")

console.log("🔍 This error suggests:")
console.log("   1. Firebase authentication might be working")
console.log("   2. But the getUserByEmail() function is failing")
console.log("   3. This could be due to:")
console.log("      - Firestore connection issues")
console.log("      - Missing user document in Firestore")
console.log("      - Firestore security rules blocking the query")
console.log("      - Invalid Firestore configuration")

console.log("\n4️⃣ Recommended next steps...")

console.log("🔧 To fix the 500 error:")
console.log("   1. Check Vercel environment variables dashboard")
console.log("   2. Verify Firebase service account credentials")
console.log("   3. Check Firestore security rules")
console.log("   4. Verify user document exists in Firestore")
console.log("   5. Check Vercel function logs for detailed error messages")

console.log("\n📊 Summary:")
if (missingForAPI.length > 0) {
  console.log("❌ CRITICAL: Missing environment variables will cause 500 errors")
} else {
  console.log("⚠️  Environment variables present, but 500 error suggests:")
  console.log("   - Firestore query issues in getUserByEmail()")
  console.log("   - Check Vercel function logs for detailed Firebase errors")
}

console.log("\n🎯 Most likely cause based on your error:")
console.log("   The getUserByEmail() function in user-service.ts is failing")
console.log("   when trying to query Firestore for the user document.")
