import { initializeApp } from "firebase/app"
import { getFirestore, doc, getDoc } from "firebase/firestore"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

console.log("🔥 === FIREBASE CONNECTION TEST ===")

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

console.log("📋 Firebase Config Check:")
console.log("- Project ID:", firebaseConfig.projectId || "MISSING")
console.log("- Auth Domain:", firebaseConfig.authDomain || "MISSING")
console.log("- API Key:", firebaseConfig.apiKey ? "SET" : "MISSING")

try {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig)
  const db = getFirestore(app)
  console.log("✅ Firebase initialized successfully")

  // Test specific user document
  const userId = "HN2QjNvnWKQ37nVXCSkhXdCwMEH2"
  console.log(`\n🔍 Testing user document: ${userId}`)

  const userRef = doc(db, "users", userId)
  const userDoc = await getDoc(userRef)

  if (userDoc.exists()) {
    const userData = userDoc.data()
    console.log("✅ User document EXISTS")
    console.log("📊 User data:", {
      name: userData.name,
      email: userData.email,
      status: userData.status,
      hasFirebaseAuth: userData.hasFirebaseAuth,
      approvedAt: userData.approvedAt?.toDate?.() || userData.approvedAt,
      trainers: userData.trainers,
    })
  } else {
    console.log("❌ User document does NOT exist")
  }

  // Test client document
  const trainerId = "5tVdK6LXCifZgjxD7rml3nEOXmh1"
  const clientId = "CGLJmpv59IngpsYpW7PZ"
  console.log(`\n🔍 Testing client document: ${clientId}`)

  const clientRef = doc(db, "users", trainerId, "clients", clientId)
  const clientDoc = await getDoc(clientRef)

  if (clientDoc.exists()) {
    const clientData = clientDoc.data()
    console.log("✅ Client document EXISTS")
    console.log("📊 Client data:", {
      name: clientData.name,
      email: clientData.email,
      status: clientData.status,
      userId: clientData.userId,
      isTemporary: clientData.isTemporary,
    })

    // Check if client's userId matches our test user
    if (clientData.userId === userId) {
      console.log("✅ Client userId MATCHES test user")
    } else {
      console.log("❌ Client userId does NOT match test user")
      console.log(`   Client userId: ${clientData.userId}`)
      console.log(`   Test userId: ${userId}`)
    }
  } else {
    console.log("❌ Client document does NOT exist")
  }

  console.log("\n🎯 === STATUS ANALYSIS ===")
  if (userDoc.exists() && clientDoc.exists()) {
    const userData = userDoc.data()
    const clientData = clientDoc.data()

    console.log("User status:", userData.status)
    console.log("Client status:", clientData.status)

    if (userData.status === "pending_approval") {
      console.log('🚨 ISSUE FOUND: User status is "pending_approval"')
      console.log("💡 This might be blocking program sending")
    }

    if (clientData.status === "Active" && userData.status !== "active") {
      console.log("⚠️  STATUS MISMATCH: Client is Active but User is not")
    }
  }
} catch (error) {
  console.error("❌ Firebase test failed:", error)
  console.error("Error details:", {
    code: error.code,
    message: error.message,
  })
}
