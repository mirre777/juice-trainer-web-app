import dotenv from "dotenv"

// Load environment variables
dotenv.config()

console.log("🔍 CHECKING ENVIRONMENT VARIABLES...\n")

// Firebase Client Configuration (Public)
const clientVars = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Firebase Server Configuration (Private)
const serverVars = {
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
  FIREBASE_PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID,
  FIREBASE_CLIENT_ID: process.env.FIREBASE_CLIENT_ID,
}

// Other Required Variables
const otherVars = {
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
}

console.log("📱 FIREBASE CLIENT CONFIGURATION:")
let clientMissing = 0
Object.entries(clientVars).forEach(([key, value]) => {
  const status = value ? "✅" : "❌"
  const displayValue = value ? (key.includes("KEY") ? "[HIDDEN]" : value.substring(0, 20) + "...") : "MISSING"
  console.log(`  ${status} ${key}: ${displayValue}`)
  if (!value) clientMissing++
})

console.log("\n🔐 FIREBASE SERVER CONFIGURATION:")
let serverMissing = 0
Object.entries(serverVars).forEach(([key, value]) => {
  const status = value ? "✅" : "❌"
  const displayValue = value ? "[HIDDEN]" : "MISSING"
  console.log(`  ${status} ${key}: ${displayValue}`)
  if (!value) serverMissing++
})

console.log("\n⚙️  OTHER CONFIGURATION:")
let otherMissing = 0
Object.entries(otherVars).forEach(([key, value]) => {
  const status = value ? "✅" : "❌"
  const displayValue = value ? (key.includes("KEY") || key.includes("SECRET") ? "[HIDDEN]" : value) : "MISSING"
  console.log(`  ${status} ${key}: ${displayValue}`)
  if (!value && (key === "ENCRYPTION_KEY" || key === "NEXT_PUBLIC_APP_URL")) otherMissing++
})

console.log("\n📊 SUMMARY:")
console.log(`  Client variables missing: ${clientMissing}/7`)
console.log(`  Server variables missing: ${serverMissing}/4`)
console.log(`  Critical other variables missing: ${otherMissing}/2`)

const totalMissing = clientMissing + serverMissing + otherMissing
if (totalMissing === 0) {
  console.log("\n🎉 ALL CRITICAL ENVIRONMENT VARIABLES ARE PRESENT!")
} else {
  console.log(`\n⚠️  ${totalMissing} CRITICAL ENVIRONMENT VARIABLES ARE MISSING!`)
  console.log("\n🔧 NEXT STEPS:")
  console.log("1. Go to Vercel Dashboard → Project Settings → Environment Variables")
  console.log("2. Add the missing variables listed above")
  console.log("3. Get values from Firebase Console → Project Settings")
  console.log("4. Redeploy your application")
}

console.log("\n🌍 ENVIRONMENT INFO:")
console.log(`  NODE_ENV: ${process.env.NODE_ENV || "not set"}`)
console.log(`  VERCEL: ${process.env.VERCEL === "1" ? "Yes" : "No"}`)
console.log(`  VERCEL_ENV: ${process.env.VERCEL_ENV || "not set"}`)

// Validation checks
console.log("\n🔍 VALIDATION CHECKS:")
if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY.startsWith("AIza")) {
    console.log("  ✅ Firebase API Key format is correct")
  } else {
    console.log("  ❌ Firebase API Key format is incorrect (should start with 'AIza')")
  }
}

if (process.env.FIREBASE_CLIENT_EMAIL) {
  if (
    process.env.FIREBASE_CLIENT_EMAIL.includes("@") &&
    process.env.FIREBASE_CLIENT_EMAIL.includes(".iam.gserviceaccount.com")
  ) {
    console.log("  ✅ Firebase Client Email format is correct")
  } else {
    console.log("  ❌ Firebase Client Email format is incorrect (should be service account email)")
  }
}

if (process.env.FIREBASE_PRIVATE_KEY) {
  if (process.env.FIREBASE_PRIVATE_KEY.includes("-----BEGIN PRIVATE KEY-----")) {
    console.log("  ✅ Firebase Private Key format is correct")
  } else {
    console.log("  ❌ Firebase Private Key format is incorrect")
  }
}

if (process.env.NEXT_PUBLIC_APP_URL) {
  if (process.env.NEXT_PUBLIC_APP_URL.startsWith("http")) {
    console.log("  ✅ App URL format is correct")
  } else {
    console.log("  ❌ App URL format is incorrect (should start with http)")
  }
}
