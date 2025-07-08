const { initializeApp } = require("firebase/app")
const {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  Timestamp,
  serverTimestamp,
  writeBatch,
} = require("firebase/firestore")

// Simple Firebase config check
console.log("🔍 Checking Firebase config...")
console.log("API Key exists:", !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY)
console.log("Project ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let app, db

try {
  app = initializeApp(firebaseConfig)
  db = getFirestore(app)
  console.log("✅ Firebase initialized successfully")
} catch (error) {
  console.error("❌ Firebase initialization failed:", error.message)
  process.exit(1)
}

async function simpleTimestampTest() {
  console.log("\n🧪 Starting simple timestamp test...")

  const testUserId = "test-user-simple"
  const testProgramId = "test-program-simple"

  try {
    // Test 1: Basic Timestamp.now() test
    console.log("\n📝 Test 1: Basic Timestamp.now() test")

    const now = Timestamp.now()
    console.log("Created timestamp:", now)
    console.log("Type:", typeof now)
    console.log("Constructor:", now.constructor.name)
    console.log("Has seconds:", !!now.seconds)
    console.log("Has nanoseconds:", !!now.nanoseconds)

    // Create a simple program object
    const program = {
      id: testProgramId,
      name: "Simple Test Program",
      createdAt: now,
      startedAt: now,
      updatedAt: now,
    }

    console.log("\nProgram object before saving:")
    console.log("createdAt type:", typeof program.createdAt)
    console.log("createdAt constructor:", program.createdAt.constructor.name)

    // Save to Firestore
    const programRef = doc(db, "users", testUserId, "programs", testProgramId)
    await setDoc(programRef, program)
    console.log("✅ Program saved to Firestore")

    // Read it back
    const savedDoc = await getDoc(programRef)
    if (savedDoc.exists()) {
      const savedData = savedDoc.data()
      console.log("\n📖 Retrieved from Firestore:")
      console.log("createdAt:", savedData.createdAt)
      console.log("createdAt type:", typeof savedData.createdAt)
      console.log("createdAt constructor:", savedData.createdAt?.constructor?.name)
      console.log("Has seconds:", !!savedData.createdAt?.seconds)
      console.log("Has nanoseconds:", !!savedData.createdAt?.nanoseconds)
      console.log("Is Timestamp instance:", savedData.createdAt instanceof Timestamp)

      // Check the raw structure
      console.log("Raw createdAt structure:", JSON.stringify(savedData.createdAt, null, 2))
    } else {
      console.log("❌ Document not found")
    }

    // Test 2: Test with writeBatch (your actual method)
    console.log("\n📝 Test 2: Testing with writeBatch")

    const batch = writeBatch(db)
    const batchProgram = {
      id: testProgramId + "-batch",
      name: "Batch Test Program",
      createdAt: Timestamp.now(),
      startedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    console.log("Batch program before adding to batch:")
    console.log("createdAt type:", typeof batchProgram.createdAt)
    console.log("createdAt constructor:", batchProgram.createdAt.constructor.name)

    const batchRef = doc(db, "users", testUserId, "programs", testProgramId + "-batch")
    batch.set(batchRef, batchProgram)

    await batch.commit()
    console.log("✅ Batch committed")

    // Read batch result
    const batchDoc = await getDoc(batchRef)
    if (batchDoc.exists()) {
      const batchData = batchDoc.data()
      console.log("\n📖 Retrieved batch data:")
      console.log("createdAt:", batchData.createdAt)
      console.log("createdAt type:", typeof batchData.createdAt)
      console.log("createdAt constructor:", batchData.createdAt?.constructor?.name)
      console.log("Is Timestamp instance:", batchData.createdAt instanceof Timestamp)
    }

    console.log("\n✅ Simple timestamp test completed")
  } catch (error) {
    console.error("❌ Test failed:", error)
    console.error("Stack:", error.stack)
  }
}

// Run the test
simpleTimestampTest()
  .then(() => {
    console.log("\n🎉 All tests completed")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Test suite failed:", error)
    process.exit(1)
  })
