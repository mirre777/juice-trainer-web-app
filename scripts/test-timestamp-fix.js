const { initializeApp } = require("firebase/app")
const { getFirestore, collection, doc, getDoc, setDoc, serverTimestamp, Timestamp } = require("firebase/firestore")

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
const TEST_CLIENT_ID = "test-client-timestamp-fix"

async function testTimestampFix() {
  console.log("🔧 === TESTING TIMESTAMP FIX ===")

  try {
    // Test 1: Create a program using serverTimestamp()
    console.log("\n📋 Test 1: Creating program with serverTimestamp()")

    const programId = `test-program-${Date.now()}`
    const program = {
      id: programId,
      name: "Test Program - Server Timestamp",
      notes: "Testing serverTimestamp() fix",
      createdAt: serverTimestamp(),
      startedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      duration: 4,
      program_URL: "",
      routines: [],
    }

    const programRef = doc(db, "users", TEST_USER_ID, "programs", programId)
    await setDoc(programRef, program)
    console.log("✅ Program created with serverTimestamp()")

    // Wait a moment for the server timestamp to be applied
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Read back and verify
    const storedProgram = await getDoc(programRef)
    if (storedProgram.exists()) {
      const data = storedProgram.data()
      console.log("\n📊 Stored program analysis:")
      console.log("createdAt:", data.createdAt)
      console.log("createdAt type:", typeof data.createdAt)
      console.log("createdAt constructor:", data.createdAt?.constructor?.name)
      console.log("Has seconds:", !!data.createdAt?.seconds)
      console.log("Has nanoseconds:", !!data.createdAt?.nanoseconds)
      console.log("Can convert to Date:", data.createdAt?.toDate ? data.createdAt.toDate() : "No toDate method")

      if (data.createdAt?.seconds) {
        console.log("✅ SUCCESS: Proper Firestore Timestamp detected!")
      } else {
        console.log("❌ FAILED: Not a proper Firestore Timestamp")
      }
    }

    // Test 2: Use the actual program conversion service
    console.log("\n🔧 Test 2: Testing program conversion service")

    // First create a test client
    const clientData = {
      id: TEST_CLIENT_ID,
      name: "Test Client Timestamp Fix",
      email: "test-timestamp@example.com",
      userId: TEST_USER_ID,
      status: "Active",
      hasLinkedAccount: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const clientRef = doc(db, "users", "5tVdK6LXCifZgjxD7rml3nEOXmh1", "clients", TEST_CLIENT_ID)
    await setDoc(clientRef, clientData)
    console.log("✅ Test client created")

    // Test program data
    const testProgramData = {
      program_title: "Timestamp Fix Test Program",
      duration_weeks: 2,
      routines: [
        {
          name: "Test Routine",
          exercises: [
            {
              name: "Test Exercise",
              sets: [{ reps: "10", weight: "100", notes: "Test set" }],
            },
          ],
        },
      ],
    }

    // Import and use the service
    const { programConversionService } = require("../lib/firebase/program-conversion-service.ts")

    console.log("Calling program conversion service...")
    const result = await programConversionService.sendProgramToClient(
      TEST_CLIENT_ID,
      testProgramData,
      "Timestamp fix test",
    )

    if (result.success) {
      console.log("✅ Program conversion successful:", result.programId)

      // Verify the created program has proper timestamps
      const createdProgramRef = doc(db, "users", TEST_USER_ID, "programs", result.programId)
      const createdProgramDoc = await getDoc(createdProgramRef)

      if (createdProgramDoc.exists()) {
        const createdData = createdProgramDoc.data()
        console.log("\n📊 Created program timestamp analysis:")

        console.log("createdAt:", createdData.createdAt)
        console.log("createdAt type:", typeof createdData.createdAt)
        console.log("createdAt constructor:", createdData.createdAt?.constructor?.name)
        console.log("Has seconds:", !!createdData.createdAt?.seconds)

        console.log("\nstartedAt:", createdData.startedAt)
        console.log("startedAt type:", typeof createdData.startedAt)
        console.log("startedAt constructor:", createdData.startedAt?.constructor?.name)
        console.log("Has seconds:", !!createdData.startedAt?.seconds)

        console.log("\nupdatedAt:", createdData.updatedAt)
        console.log("updatedAt type:", typeof createdData.updatedAt)
        console.log("updatedAt constructor:", createdData.updatedAt?.constructor?.name)
        console.log("Has seconds:", !!createdData.updatedAt?.seconds)

        // Check if all timestamps are proper Firestore Timestamps
        const hasProperTimestamps =
          createdData.createdAt?.seconds && createdData.startedAt?.seconds && createdData.updatedAt?.seconds

        if (hasProperTimestamps) {
          console.log("\n🎉 SUCCESS: All timestamps are proper Firestore Timestamps!")
        } else {
          console.log("\n❌ FAILED: Some timestamps are not proper Firestore Timestamps")
        }

        // Check routines too
        if (createdData.routines && createdData.routines.length > 0) {
          const routineRef = doc(db, "users", TEST_USER_ID, "routines", createdData.routines[0].routineId)
          const routineDoc = await getDoc(routineRef)

          if (routineDoc.exists()) {
            const routineData = routineDoc.data()
            console.log("\n🏋️ Routine timestamp analysis:")
            console.log("createdAt:", routineData.createdAt)
            console.log("createdAt type:", typeof routineData.createdAt)
            console.log("Has seconds:", !!routineData.createdAt?.seconds)

            if (routineData.createdAt?.seconds) {
              console.log("✅ Routine timestamps are also proper!")
            } else {
              console.log("❌ Routine timestamps are not proper")
            }
          }
        }
      }
    } else {
      console.log("❌ Program conversion failed:", result)
    }

    console.log("\n✅ === TIMESTAMP FIX TEST COMPLETE ===")
  } catch (error) {
    console.error("❌ Test failed:", error)
    console.error("Error stack:", error.stack)
  }
}

// Run the test
testTimestampFix()
  .then(() => {
    console.log("🎉 Test completed successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.error("💥 Test failed:", error)
    process.exit(1)
  })
