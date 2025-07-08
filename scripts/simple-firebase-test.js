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
console.log("")
console.log("Environment Variables Check:")
console.log("  - NEXT_PUBLIC_FIREBASE_API_KEY:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "✅ Present" : "❌ Missing")
console.log(
  "  - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:",
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "✅ Present" : "❌ Missing",
)
console.log(
  "  - NEXT_PUBLIC_FIREBASE_PROJECT_ID:",
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "✅ Present" : "❌ Missing",
)
console.log(
  "  - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:",
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? "✅ Present" : "❌ Missing",
)
console.log(
  "  - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:",
  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? "✅ Present" : "❌ Missing",
)
console.log("  - NEXT_PUBLIC_FIREBASE_APP_ID:", process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? "✅ Present" : "❌ Missing")
console.log("")

try {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig)
  const db = getFirestore(app)

  console.log("✅ Firebase initialized successfully")
  console.log("📊 Project ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
  console.log("")

  // Test specific document access
  console.log("🔍 Testing document access...")
  console.log("")

  const userId = "HN2QjNvnWKQ37nVXCSkhXdCwMEH2"
  console.log("Testing user document:", userId)

  const userDocRef = doc(db, "users", userId)
  const userDoc = await getDoc(userDocRef)

  if (userDoc.exists()) {
    console.log("✅ User document EXISTS")
    const userData = userDoc.data()
    console.log("User data:")
    console.log("  - Name:", userData.name)
    console.log("  - Email:", userData.email)
    console.log("  - Status:", userData.status)
    console.log("  - HasFirebaseAuth:", userData.hasFirebaseAuth)
    console.log("  - Trainers count:", userData.trainers ? userData.trainers.length : 0)
  } else {
    console.log("❌ User document does NOT exist")
    console.log("Path checked: users/" + userId)
  }
} catch (error) {
  console.error("❌ Firebase initialization failed:")
  console.error("  - Error code:", error.code)
  console.error("  - Error message:", error.message)

  if (error.code === "app/invalid-api-key") {
    console.error("🔑 Invalid API key - check NEXT_PUBLIC_FIREBASE_API_KEY")
  }

  if (error.code === "app/project-not-found") {
    console.error("🏗️ Project not found - check NEXT_PUBLIC_FIREBASE_PROJECT_ID")
  }
}
