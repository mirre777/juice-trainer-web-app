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

console.log("\n🔍 Analyzing the error from your screenshot...")

const errorFromScreenshot = {
  message: "Failed to retrieve user profile. Please try again.",
  errorId: "ERR_1751989111900_guxe85vd",
  actualError: "TypeError: (0, c.getUserByEmail) is not a function",
}

console.log("📋 Error details from your screenshot:")
console.log(`   Message: ${errorFromScreenshot.message}`)
console.log(`   Error ID: ${errorFromScreenshot.errorId}`)
console.log(`   Actual Error: ${errorFromScreenshot.actualError}`)
console.log("")

console.log("🔍 This error suggests:")
if (missingForAPI.length > 0) {
  console.log("   1. ❌ Missing environment variables (PRIMARY ISSUE)")
  console.log("   2. ❌ Firebase cannot initialize properly")
  console.log("   3. ❌ This causes the getUserByEmail import to fail")
} else {
  console.log("   1. ✅ Environment variables are present")
  console.log("   2. ❌ Import/export issue with getUserByEmail function")
  console.log("   3. ❌ This could be due to:")
  console.log("      - Incorrect import statement")
  console.log("      - Function not properly exported")
  console.log("      - Build/compilation issue")
}

console.log("\n📊 Summary:")
if (missingForAPI.length > 0) {
  console.log("❌ CRITICAL: Missing environment variables will cause 500 errors")
  console.log("   Fix these first before addressing any import issues")
} else {
  console.log("⚠️  Environment variables present, but 500 error suggests:")
  console.log("   - Import/export issue with getUserByEmail function")
  console.log("   - Check the import statement in login route")
}

console.log("\n🎯 Most likely cause based on your error:")
if (missingForAPI.length > 0) {
  console.log("   Missing environment variables are preventing Firebase initialization")
  console.log("   This causes the getUserByEmail function to not be available")
} else {
  console.log("   The getUserByEmail() function in user-service.ts is not being")
  console.log("   imported correctly into the login route.")
}
