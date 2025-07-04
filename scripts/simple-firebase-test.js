import { initializeApp } from "firebase/app"
import { getFirestore, doc, getDoc } from "firebase/firestore"

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

console.log("🔧 === FIREBASE CONNECTION TEST ===")
console.log("📋 Environment Variables:")
console.log("  - API Key:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "✅ Set" : "❌ Missing")
console.log("  - Auth Domain:", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "✅ Set" : "❌ Missing")
console.log("  - Project ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "✅ Set" : "❌ Missing")
console.log("")

try {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig)
  const db = getFirestore(app)
  console.log("✅ Firebase initialized successfully")
  console.log("")

  // Test specific document access
  console.log("🔍 Testing document access...")

  const testCases = [
    {
      name: "Client Document",
      path: "users/5tVdK6LXCifZgjxD7rml3nEOXmh1/clients/CGLJmpv59IngpsYpW7PZ",
      expectedFields: ["name", "email", "status", "userId"],
    },
    {
      name: "User Document",
      path: "users/HN2QjNvnWKQ37nVXCSkhXdCwMEH2",
      expectedFields: ["name", "email", "status", "trainers"],
    },
  ]

  for (const testCase of testCases) {
    console.log(`\n📄 Testing ${testCase.name}:`)
    console.log(`   Path: ${testCase.path}`)

    try {
      const docRef = doc(db, testCase.path)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        console.log(`   ✅ Document exists`)
        console.log(`   📊 Fields found:`)

        testCase.expectedFields.forEach((field) => {
          const value = data[field]
          if (value !== undefined) {
            console.log(`     - ${field}: ${typeof value === "object" ? JSON.stringify(value) : value}`)
          } else {
            console.log(`     - ${field}: ❌ Missing`)
          }
        })
      } else {
        console.log(`   ❌ Document does not exist`)
      }
    } catch (error) {
      console.log(`   ❌ Error accessing document:`, error.message)
    }
  }

  console.log("")
  console.log("🎯 === TEST COMPLETE ===")
} catch (error) {
  console.error("❌ Firebase initialization failed:", error.message)
  console.error("🔧 Check your environment variables and Firebase config")
}
