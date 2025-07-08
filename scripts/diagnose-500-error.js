#!/usr/bin/env node

console.log("🚨 Diagnosing 500 Internal Server Error...\n")

console.log("Based on your error message: 'Failed to retrieve user profile'")
console.log("Error ID: ERR_1751989111900_guxe85vd")
console.log("Email: mirresnelting+4@gmail.com")
console.log("")

console.log("🔍 Root Cause Analysis:")
console.log("")

// Check 1: Environment Variables
console.log("1️⃣ Environment Variables Check:")
const criticalVars = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
}

const missingCritical = []
Object.entries(criticalVars).forEach(([key, value]) => {
  if (!value) {
    missingCritical.push(key)
    console.log(`   ❌ ${key}: MISSING`)
  } else {
    console.log(`   ✅ ${key}: Present`)
  }
})

if (missingCritical.length > 0) {
  console.log(`\n🚨 FOUND THE ISSUE: Missing ${missingCritical.length} critical environment variables!`)
  console.log("   This will cause Firebase initialization to fail in your API route.")
  console.log("   Result: 500 Internal Server Error")
  console.log("\n💡 Solution:")
  console.log("   1. Go to your Vercel dashboard")
  console.log("   2. Navigate to your project settings")
  console.log("   3. Add the missing environment variables:")
  missingCritical.forEach((varName) => {
    console.log(`      - ${varName}`)
  })
  console.log("   4. Redeploy your application")
} else {
  console.log("\n✅ All critical environment variables are present")
  console.log("   The issue might be:")
}

console.log("\n2️⃣ Firebase Configuration Validation:")

if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  if (apiKey.startsWith("AIza")) {
    console.log("   ✅ Firebase API Key format is correct")
  } else {
    console.log("   ❌ Firebase API Key format is incorrect (should start with 'AIza')")
  }
}

if (process.env.FIREBASE_CLIENT_EMAIL) {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  if (clientEmail.includes("@") && clientEmail.includes(".iam.gserviceaccount.com")) {
    console.log("   ✅ Firebase Client Email format is correct")
  } else {
    console.log("   ❌ Firebase Client Email format is incorrect (should be service account email)")
  }
}

if (process.env.FIREBASE_PRIVATE_KEY) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
  if (privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
    console.log("   ✅ Firebase Private Key format is correct")
  } else {
    console.log("   ❌ Firebase Private Key format is incorrect (should contain -----BEGIN PRIVATE KEY-----)")
  }
}

console.log("\n3️⃣ Error Flow Analysis:")
console.log("   Your login request follows this path:")
console.log("   1. POST /api/auth/login")
console.log("   2. Parse email/password from request")
console.log("   3. Call getUserByEmail(email) ← THIS IS WHERE IT FAILS")
console.log("   4. getUserByEmail tries to query Firestore")
console.log("   5. Firestore query fails → throws error")
console.log("   6. Error caught → returns 500 with 'Failed to retrieve user profile'")

console.log("\n4️⃣ Most Likely Causes (in order of probability):")
console.log("   1. ❌ Missing Firebase environment variables (check above)")
console.log("   2. ❌ Invalid Firebase service account credentials")
console.log("   3. ❌ Firestore security rules blocking the query")
console.log("   4. ❌ Network connectivity issues to Firebase")
console.log("   5. ❌ User document doesn't exist in Firestore")

console.log("\n5️⃣ Immediate Action Items:")
console.log("   1. 🔧 Fix missing environment variables (if any)")
console.log("   2. 📋 Check Vercel function logs for detailed error")
console.log("   3. 🔥 Verify Firebase project configuration")
console.log("   4. 📊 Check Firestore security rules")
console.log("   5. 👤 Verify user document exists in Firestore")

console.log("\n6️⃣ How to Fix:")
if (missingCritical.length > 0) {
  console.log("   STEP 1: Add missing environment variables to Vercel")
  console.log("   STEP 2: Redeploy your application")
  console.log("   STEP 3: Test login again")
} else {
  console.log("   STEP 1: Check Vercel function logs for detailed Firebase error")
  console.log("   STEP 2: Verify Firebase service account JSON is correct")
  console.log("   STEP 3: Check Firestore security rules")
  console.log("   STEP 4: Verify user document exists in 'users' collection")
}

console.log("\n🎯 CONCLUSION:")
if (missingCritical.length > 0) {
  console.log("   ❌ CRITICAL ISSUE FOUND: Missing environment variables")
  console.log("   This is definitely causing your 500 error.")
} else {
  console.log("   ⚠️  Environment variables look OK")
  console.log("   The issue is likely in Firebase/Firestore configuration or connectivity.")
}

console.log("\n📞 Next Steps:")
console.log("   1. Fix any issues identified above")
console.log("   2. Check your Vercel dashboard for environment variables")
console.log("   3. Look at Vercel function logs for detailed error messages")
console.log("   4. Test the login again after making changes")
