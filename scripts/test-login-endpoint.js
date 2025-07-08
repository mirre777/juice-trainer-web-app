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
console.log("From Vercel Logs: 'TypeError: (0, c.getUserByEmail) is not a function'")
console.log("Location: /var/task/.next/server/app/api/auth/login/route.js:1599")
console.log("Status Code: 500")

console.log("\n🕵️ Error Analysis:")
console.log("This error occurs because:")
console.log("1. ❌ getUserByEmail function is not properly imported")
console.log("2. ❌ The import statement in login route is incorrect")
console.log("3. ❌ The function might not be exported from user-service.ts")

console.log("\n🎯 Root Cause Analysis:")
console.log("❌ ACTUAL ISSUE: Import/Export problem with getUserByEmail")
console.log("   This is NOT an environment variable issue")
console.log("   The function getUserByEmail is not being imported correctly")

if (missingVars.length > 0) {
  console.log("\n⚠️  Additional Issue: Missing environment variables")
  console.log("   Missing variables:", missingVars.join(", "))
  console.log("   Fix these too, but the main issue is the import error")
} else {
  console.log("\n✅ Environment variables are present")
  console.log("   Focus on fixing the getUserByEmail import issue")
}

console.log("\n🔧 Recommended Fix Order:")
console.log("1. Fix getUserByEmail import in login route")
console.log("2. Verify getUserByEmail export in user-service.ts")
console.log("3. Test login again")
console.log("4. Check for any remaining environment variable issues")

console.log("\n🧪 Import Analysis:")
console.log("Current import in login route should be:")
console.log("import { getUserByEmail } from '@/lib/firebase/user-service'")
console.log("")
console.log("Make sure user-service.ts exports:")
console.log("export async function getUserByEmail(email: string) { ... }")
