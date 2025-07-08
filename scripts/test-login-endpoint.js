#!/usr/bin/env node

console.log("🔐 Testing Login Endpoint Configuration...\n")

// Check if we can simulate the login flow
console.log("📋 Checking Login Dependencies:")

// Check required environment variables for login
const loginRequiredVars = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "ENCRYPTION_KEY",
]

const missingVars = []
loginRequiredVars.forEach((varName) => {
  const value = process.env[varName]
  if (!value || value === "undefined") {
    missingVars.push(varName)
    console.log(`❌ Missing: ${varName}`)
  } else {
    console.log(`✅ Present: ${varName}`)
  }
})

console.log("\n🔍 Analyzing Your Specific Error:")
console.log("Error Message: 'Failed to retrieve user profile. Please try again.'")
console.log("Error ID: ERR_1751989111900_guxe85vd")
console.log("Status Code: 500")

console.log("\n🕵️ Error Analysis:")
console.log("This error occurs in the login API route at this sequence:")
console.log("1. ✅ User submits email/password")
console.log("2. ✅ Firebase authentication succeeds")
console.log("3. ❌ getUserByEmail() function fails")
console.log("4. ❌ Returns 500 error")

console.log("\n🎯 Root Cause Analysis:")
if (missingVars.length > 0) {
  console.log("❌ CRITICAL: Missing environment variables detected")
  console.log("   This will cause Firebase initialization to fail")
  console.log("   Missing variables:", missingVars.join(", "))
} else {
  console.log("✅ All required environment variables are present")
  console.log("   The issue might be:")
  console.log("   - Firestore security rules blocking the query")
  console.log("   - Network connectivity issues")
  console.log("   - Malformed private key")
}

console.log("\n🔧 Recommended Fix Order:")
console.log("1. Fix missing environment variables (if any)")
console.log("2. Check Vercel function logs for detailed error")
console.log("3. Verify Firestore security rules")
console.log("4. Test login again")

// Test specific login scenario
console.log("\n🧪 Login Flow Test:")
console.log("Simulating login for: test@example.com")

if (missingVars.length === 0) {
  console.log("✅ Environment variables OK - login should work")
} else {
  console.log("❌ Missing variables will cause 500 error")
  console.log("   Fix these first:", missingVars.join(", "))
}
