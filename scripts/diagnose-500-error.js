#!/usr/bin/env node

console.log("🚨 Diagnosing 500 Internal Server Error...\n")

console.log("📊 Error Details from Screenshot:")
console.log("- Error Message: 'Failed to retrieve user profile. Please try again.'")
console.log("- Error ID: ERR_1751989111900_guxe85vd")
console.log("- Location: Login API route")
console.log("- Function: getUserByEmail()")

console.log("\n🔍 STEP 1: Environment Variables Check")

// Critical variables for login functionality
const criticalVars = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
}

const missingCritical = []
const presentVars = []

Object.entries(criticalVars).forEach(([name, value]) => {
  if (!value || value === "undefined" || value.trim() === "") {
    missingCritical.push(name)
    console.log(`❌ MISSING: ${name}`)
  } else {
    presentVars.push(name)
    console.log(`✅ PRESENT: ${name}`)
  }
})

console.log(`\n📈 Results: ${presentVars.length}/${Object.keys(criticalVars).length} variables present`)

if (missingCritical.length > 0) {
  console.log("\n🚨 CONCLUSION:")
  console.log("❌ CRITICAL ISSUE FOUND: Missing environment variables")
  console.log("   This is definitely causing your 500 error.")

  console.log("\n📋 Missing Variables:")
  missingCritical.forEach((varName) => {
    console.log(`   • ${varName}`)
  })

  console.log("\n🔧 IMMEDIATE FIX:")
  console.log("1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables")
  console.log("2. Add these missing variables:")
  missingCritical.forEach((varName) => {
    console.log(`   - ${varName}`)
  })
  console.log("3. Get values from your Firebase Console → Project Settings")
  console.log("4. Redeploy your application")
  console.log("5. Test login again")
} else {
  console.log("\n✅ All critical environment variables are present")
  console.log("\n🔍 STEP 2: Advanced Diagnosis Needed")
  console.log("Since env vars are OK, the issue might be:")
  console.log("1. Firestore security rules blocking queries")
  console.log("2. Malformed Firebase private key")
  console.log("3. Network/connectivity issues")
  console.log("4. User document structure mismatch")

  console.log("\n🔧 Next Steps:")
  console.log("1. Check Vercel function logs for detailed error")
  console.log("2. Verify Firestore security rules allow reads")
  console.log("3. Test Firebase connection manually")
}

console.log("\n📞 Next Steps:")
console.log("1. Fix any issues identified above")
console.log("2. Check your Vercel dashboard for environment variables")
console.log("3. Look at Vercel function logs for detailed error messages")
console.log("4. Test the login again after making changes")

console.log("\n🎯 Quick Test:")
console.log("Try logging in again after fixing the missing variables.")
console.log("If it still fails, check the Vercel function logs for the detailed Firebase error.")
