import { initializeApp } from "firebase/app"
import { getFirestore, doc, getDoc } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

console.log("🔧 Firebase Config:")
console.log("  Project ID:", firebaseConfig.projectId)
console.log("  Auth Domain:", firebaseConfig.authDomain)

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function testFirebaseConnection() {
  console.log("\n🧪 Testing Firebase Connection...")

  const userId = "HN2QjNvnWKQ37nVXCSkhXdCwMEH2"
  console.log("Testing user ID:", userId)

  try {
    console.log("📡 Attempting to fetch user document...")
    const userRef = doc(db, "users", userId)
    console.log("Document reference created:", userRef.path)

    const userDoc = await getDoc(userRef)
    console.log("Document fetch completed")

    if (userDoc.exists()) {
      const userData = userDoc.data()
      console.log("✅ SUCCESS: User document found!")
      console.log("User data:", {
        name: userData.name,
        status: userData.status,
        trainers: userData.trainers,
        email: userData.email,
      })
    } else {
      console.log("❌ FAILED: User document does not exist")
      console.log("This means either:")
      console.log("  1. Document doesn't exist (but we see it in Firebase console)")
      console.log("  2. Permission denied")
      console.log("  3. Wrong project/database")
    }
  } catch (error) {
    console.error("💥 ERROR:", error.message)
    console.error("Error code:", error.code)
    console.error("Full error:", error)
  }
}

testFirebaseConnection()
  .then(() => {
    console.log("\n✅ Test completed")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n💥 Test failed:", error)
    process.exit(1)
  })
