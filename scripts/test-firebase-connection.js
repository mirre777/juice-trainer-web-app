import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

console.log("🔥 TESTING FIREBASE CONNECTION...\n")

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

console.log("📋 FIREBASE CONFIG CHECK:")
Object.entries(firebaseConfig).forEach(([key, value]) => {
  const status = value ? "✅" : "❌"
  console.log(`  ${status} ${key}: ${value ? "Present" : "Missing"}`)
})

try {
  console.log("\n🚀 INITIALIZING FIREBASE APP...")
  const app = initializeApp(firebaseConfig)
  console.log("✅ Firebase app initialized successfully")
  console.log(`   Project ID: ${app.options.projectId}`)
  console.log(`   App Name: ${app.name}`)

  console.log("\n🔐 TESTING FIREBASE AUTH...")
  const auth = getAuth(app)
  console.log("✅ Firebase Auth initialized successfully")
  console.log(`   Auth instance: ${auth ? "Available" : "Not available"}`)

  console.log("\n📊 TESTING FIRESTORE...")
  const db = getFirestore(app)
  console.log("✅ Firestore initialized successfully")
  console.log(`   Firestore instance: ${db ? "Available" : "Not available"}`)
  console.log(`   App reference: ${db.app.name}`)

  console.log("\n🎉 ALL FIREBASE SERVICES INITIALIZED SUCCESSFULLY!")
} catch (error) {
  console.error("\n❌ FIREBASE INITIALIZATION FAILED:")
  console.error(`   Error: ${error.message}`)
  console.error(`   Code: ${error.code || "N/A"}`)

  if (error.message.includes("API key")) {
    console.log("\n💡 SUGGESTION: Check your NEXT_PUBLIC_FIREBASE_API_KEY")
  }
  if (error.message.includes("project")) {
    console.log("\n💡 SUGGESTION: Check your NEXT_PUBLIC_FIREBASE_PROJECT_ID")
  }
  if (error.message.includes("auth")) {
    console.log("\n💡 SUGGESTION: Check your NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN")
  }
}

console.log("\n🔍 ADDITIONAL CHECKS:")
console.log(`  Environment: ${process.env.NODE_ENV || "development"}`)
console.log(`  Vercel: ${process.env.VERCEL === "1" ? "Yes" : "No"}`)
console.log(`  Timestamp: ${new Date().toISOString()}`)
