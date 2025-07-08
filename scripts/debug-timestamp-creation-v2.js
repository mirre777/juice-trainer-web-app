const { initializeApp } = require("firebase/app")
const {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
} = require("firebase/firestore")

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const TEST_USER_ID = "HN2QjNvnWKQ37nVXCSKhXdCwl"

async function debugTimestampCreation() {
  console.log("🔧 === DEBUGGING TIMESTAMP CREATION V2 ===")

  try {
    // Test 1: Direct serverTimestamp() usage
    console.log("\n📋 Test 1: Direct serverTimestamp() usage")

    const testId1 = `test-direct-${Date.now()}`
    const directDoc = {
      id: testId1,
      name: "Direct ServerTimestamp Test",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    console.log("serverTimestamp() object:", serverTimestamp())
    console.log("typeof serverTimestamp():", typeof serverTimestamp())
    console.log("serverTimestamp() constructor:", serverTimestamp().constructor.name)

    await setDoc(doc(db, "users", TEST_USER_ID, "test-timestamps", testId1), directDoc)
    console.log("✅ Direct document created")

    // Wait and read back
    await new Promise((resolve) => setTimeout(resolve, 2000))
    const directResult = await getDoc(doc(db, "users", TEST_USER_ID, "test-timestamps", testId1))

    if (directResult.exists()) {
      const data = directResult.data()
      console.log("📊 Direct result analysis:")
      console.log("createdAt:", data.createdAt)
      console.log("createdAt type:", typeof data.createdAt)
      console.log("Has seconds:", !!data.createdAt?.seconds)
      console.log("Is proper timestamp:", data.createdAt?.seconds ? "✅ YES" : "❌ NO")
    }

    // Test 2: Batch operation with serverTimestamp()
    console.log("\n📋 Test 2: Batch operation with serverTimestamp()")

    const batch = writeBatch(db)
    const testId2 = `test-batch-${Date.now()}`

    const batchDoc = {
      id: testId2,
      name: "Batch ServerTimestamp Test",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const batchRef = doc(db, "users", TEST_USER_ID, "test-timestamps", testId2)
    batch.set(batchRef, batchDoc)

    await batch.commit()
    console.log("✅ Batch document created")

    // Wait and read back
    await new Promise((resolve) => setTimeout(resolve, 2000))
    const batchResult = await getDoc(batchRef)

    if (batchResult.exists()) {
      const data = batchResult.data()
      console.log("📊 Batch result analysis:")
      console.log("createdAt:", data.createdAt)
      console.log("createdAt type:", typeof data.createdAt)
      console.log("Has seconds:", !!data.createdAt?.seconds)
      console.log("Is proper timestamp:", data.createdAt?.seconds ? "✅ YES" : "❌ NO")
    }

    // Test 3: Using Timestamp.now() instead
    console.log("\n📋 Test 3: Using Timestamp.now() instead")

    const testId3 = `test-now-${Date.now()}`
    const nowDoc = {
      id: testId3,
      name: "Timestamp.now() Test",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    console.log("Timestamp.now() object:", Timestamp.now())
    console.log("typeof Timestamp.now():", typeof Timestamp.now())
    console.log("Timestamp.now() constructor:", Timestamp.now().constructor.name)

    await setDoc(doc(db, "users", TEST_USER_ID, "test-timestamps", testId3), nowDoc)
    console.log("✅ Timestamp.now() document created")

    // Read back immediately (no wait needed for Timestamp.now())
    const nowResult = await getDoc(doc(db, "users", TEST_USER_ID, "test-timestamps", testId3))

    if (nowResult.exists()) {
      const data = nowResult.data()
      console.log("📊 Timestamp.now() result analysis:")
      console.log("createdAt:", data.createdAt)
      console.log("createdAt type:", typeof data.createdAt)
      console.log("Has seconds:", !!data.createdAt?.seconds)
      console.log("Is proper timestamp:", data.createdAt?.seconds ? "✅ YES" : "❌ NO")
    }

    // Test 4: Using Timestamp.fromDate()
    console.log("\n📋 Test 4: Using Timestamp.fromDate()")

    const testId4 = `test-fromdate-${Date.now()}`
    const fromDateDoc = {
      id: testId4,
      name: "Timestamp.fromDate() Test",
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    }

    console.log("Timestamp.fromDate() object:", Timestamp.fromDate(new Date()))
    console.log("typeof Timestamp.fromDate():", typeof Timestamp.fromDate(new Date()))
    console.log("Timestamp.fromDate() constructor:", Timestamp.fromDate(new Date()).constructor.name)

    await setDoc(doc(db, "users", TEST_USER_ID, "test-timestamps", testId4), fromDateDoc)
    console.log("✅ Timestamp.fromDate() document created")

    // Read back
    const fromDateResult = await getDoc(doc(db, "users", TEST_USER_ID, "test-timestamps", testId4))

    if (fromDateResult.exists()) {
      const data = fromDateResult.data()
      console.log("📊 Timestamp.fromDate() result analysis:")
      console.log("createdAt:", data.createdAt)
      console.log("createdAt type:", typeof data.createdAt)
      console.log("Has seconds:", !!data.createdAt?.seconds)
      console.log("Is proper timestamp:", data.createdAt?.seconds ? "✅ YES" : "❌ NO")
    }

    // Test 5: Batch with Timestamp.now()
    console.log("\n📋 Test 5: Batch with Timestamp.now()")

    const batch2 = writeBatch(db)
    const testId5 = `test-batch-now-${Date.now()}`

    const batchNowDoc = {
      id: testId5,
      name: "Batch Timestamp.now() Test",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    const batchNowRef = doc(db, "users", TEST_USER_ID, "test-timestamps", testId5)
    batch2.set(batchNowRef, batchNowDoc)

    await batch2.commit()
    console.log("✅ Batch Timestamp.now() document created")

    // Read back
    const batchNowResult = await getDoc(batchNowRef)

    if (batchNowResult.exists()) {
      const data = batchNowResult.data()
      console.log("📊 Batch Timestamp.now() result analysis:")
      console.log("createdAt:", data.createdAt)
      console.log("createdAt type:", typeof data.createdAt)
      console.log("Has seconds:", !!data.createdAt?.seconds)
      console.log("Is proper timestamp:", data.createdAt?.seconds ? "✅ YES" : "❌ NO")
    }

    console.log("\n🎯 === SUMMARY ===")
    console.log("The tests above will show which timestamp method works correctly.")
    console.log("Look for the method that shows 'Is proper timestamp: ✅ YES'")
  } catch (error) {
    console.error("❌ Test failed:", error)
    console.error("Error stack:", error.stack)
  }
}

// Run the test
debugTimestampCreation()
  .then(() => {
    console.log("🎉 Debug completed")
    process.exit(0)
  })
  .catch((error) => {
    console.error("💥 Debug failed:", error)
    process.exit(1)
  })
