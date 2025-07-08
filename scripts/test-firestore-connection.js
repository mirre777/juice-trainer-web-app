const { initializeApp } = require("firebase/app")
const { getFirestore, collection, getDocs, query, where, limit } = require("firebase/firestore")

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

async function testFirestoreConnection() {
  try {
    console.log("🔄 Testing Firestore connection...")

    // Initialize Firebase
    const app = initializeApp(firebaseConfig)
    const db = getFirestore(app)

    console.log("✅ Firebase initialized successfully")

    // Test basic query
    const usersRef = collection(db, "users")
    const q = query(usersRef, limit(5))
    const snapshot = await getDocs(q)

    console.log(`📊 Found ${snapshot.size} users in collection`)

    // Look for specific user
    const emailToFind = "mirresnelting+4@gmail.com"
    const userQuery = query(usersRef, where("email", "==", emailToFind))
    const userSnapshot = await getDocs(userQuery)

    console.log(`🔍 Searching for user: ${emailToFind}`)
    console.log(`📋 Found ${userSnapshot.size} matching users`)

    if (!userSnapshot.empty) {
      userSnapshot.forEach((doc) => {
        const data = doc.data()
        console.log("👤 User found:", {
          id: doc.id,
          email: data.email,
          role: data.role,
          name: data.name,
        })
      })
    }

    // Also try without +4
    const altEmail = "mirresnelting@gmail.com"
    const altQuery = query(usersRef, where("email", "==", altEmail))
    const altSnapshot = await getDocs(altQuery)

    console.log(`🔍 Searching for user: ${altEmail}`)
    console.log(`📋 Found ${altSnapshot.size} matching users`)

    if (!altSnapshot.empty) {
      altSnapshot.forEach((doc) => {
        const data = doc.data()
        console.log("👤 User found:", {
          id: doc.id,
          email: data.email,
          role: data.role,
          name: data.name,
        })
      })
    }
  } catch (error) {
    console.error("❌ Error testing Firestore:", error)
    console.error("Error details:", {
      code: error.code,
      message: error.message,
    })
  }
}

testFirestoreConnection()
