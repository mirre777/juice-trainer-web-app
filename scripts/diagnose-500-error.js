#!/usr/bin/env node

console.log("🚨 Diagnosing 500 Internal Server Error...\n")

console.log("📊 Error Details from Vercel Logs:")
console.log("- Error: TypeError: (0, c.getUserByEmail) is not a function")
console.log("- Location: /var/task/.next/server/app/api/auth/login/route.js:1599")
console.log("- Function: Login API route")
console.log("- Root Cause: Import/Export issue")

console.log("\n🔍 STEP 1: Analyzing the TypeError")
console.log("The error '(0, c.getUserByEmail) is not a function' means:")
console.log("1. The import statement is trying to destructure getUserByEmail")
console.log("2. But getUserByEmail is undefined or not exported properly")
console.log("3. This causes a TypeError when trying to call it")

console.log("\n🔍 STEP 2: Environment Variables Check")

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

console.log("\n🚨 CONCLUSION:")
console.log("❌ PRIMARY ISSUE: getUserByEmail import/export error")
console.log("   This is the main cause of your 500 error")

if (missingCritical.length > 0) {
  console.log("❌ SECONDARY ISSUE: Missing environment variables")
  console.log("   These also need to be fixed")

  console.log("\n📋 Missing Variables:")
  missingCritical.forEach((varName) => {
    console.log(`   • ${varName}`)
  })
}

console.log("\n🔧 IMMEDIATE FIX STEPS:")
console.log("1. Fix the getUserByEmail import issue first:")
console.log("   - Check the import statement in login route")
console.log("   - Verify the export in user-service.ts")
console.log("   - Make sure the function is properly exported")

if (missingCritical.length > 0) {
  console.log("2. Add missing environment variables to Vercel:")
  missingCritical.forEach((varName) => {
    console.log(`   - ${varName}`)
  })
}

console.log("3. Redeploy your application")
console.log("4. Test login again")

console.log("\n🎯 The Real Problem:")
console.log("Your Vercel logs show the actual error is NOT missing environment variables.")
console.log("It's a JavaScript TypeError because getUserByEmail is not a function.")
console.log("This means there's an import/export mismatch in your code.")

console.log("\n📞 Next Steps:")
console.log("1. Check the import statement in app/api/auth/login/route.ts")
console.log("2. Verify getUserByEmail is exported from lib/firebase/user-service.ts")
console.log("3. Fix any import/export issues")
console.log("4. Test the login again")
