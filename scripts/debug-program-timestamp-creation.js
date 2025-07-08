const { initializeApp } = require("firebase/app")
const {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  Timestamp,
  connectFirestoreEmulator,
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

// Test data
const TEST_TRAINER_ID = "5tVdK6LXCifZgjxD7rml3nEOXmh1"
const TEST_CLIENT_ID = "test-client-123" // We'll create this for testing
const TEST_USER_ID = "test-user-456" // We'll create this for testing

async function debugTimestampCreation() {
  console.log("🔍 === DEBUGGING TIMESTAMP CREATION ===")

  try {
    // Step 1: Test different timestamp creation methods
    console.log("\n📅 Step 1: Testing timestamp creation methods")

    const method1 = Timestamp.now()
    const method2 = Timestamp.fromDate(new Date())
    const method3 = new Date()
    const method4 = new Date().toISOString()

    console.log("Method 1 - Timestamp.now():", method1)
    console.log("Type:", typeof method1)
    console.log("Constructor:", method1.constructor.name)
    console.log("Has seconds:", !!method1.seconds)
    console.log("Has nanoseconds:", !!method1.nanoseconds)

    console.log("\nMethod 2 - Timestamp.fromDate(new Date()):", method2)
    console.log("Type:", typeof method2)
    console.log("Constructor:", method2.constructor.name)
    console.log("Has seconds:", !!method2.seconds)
    console.log("Has nanoseconds:", !!method2.nanoseconds)

    console.log("\nMethod 3 - new Date():", method3)
    console.log("Type:", typeof method3)
    console.log("Constructor:", method3.constructor.name)

    console.log("\nMethod 4 - new Date().toISOString():", method4)
    console.log("Type:", typeof method4)

    // Step 2: Create test client document
    console.log("\n👤 Step 2: Creating test client document")

    const clientDocRef = doc(db, "users", TEST_TRAINER_ID, "clients", TEST_CLIENT_ID)
    const clientData = {
      id: TEST_CLIENT_ID,
      name: "Test Client",
      email: "testclient@example.com",
      userId: TEST_USER_ID,
      status: "Active",
      hasLinkedAccount: true,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    }

    await setDoc(clientDocRef, clientData)
    console.log("✅ Created test client document")

    // Step 3: Create test user document
    console.log("\n🔑 Step 3: Creating test user document")

    const userDocRef = doc(db, "users", TEST_USER_ID)
    const userData = {
      id: TEST_USER_ID,
      email: "testclient@example.com",
      status: "active",
      hasFirebaseAuth: true,
      firebaseUid: "test-firebase-uid",
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    }

    await setDoc(userDocRef, userData)
    console.log("✅ Created test user document")

    // Step 4: Test program creation with different timestamp methods
    console.log("\n📋 Step 4: Testing program creation with different timestamp methods")

    // Test with Timestamp.now()
    const programId1 = "test-program-timestamp-now"
    const program1 = {
      id: programId1,
      name: "Test Program - Timestamp.now()",
      notes: "Testing with Timestamp.now()",
      createdAt: Timestamp.now(),
      startedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      duration: 4,
      program_URL: "",
      routines: [],
    }

    const programRef1 = doc(db, "users", TEST_USER_ID, "programs", programId1)
    await setDoc(programRef1, program1)
    console.log("✅ Created program with Timestamp.now()")

    // Test with Timestamp.fromDate()
    const programId2 = "test-program-timestamp-fromdate"
    const program2 = {
      id: programId2,
      name: "Test Program - Timestamp.fromDate()",
      notes: "Testing with Timestamp.fromDate()",
      createdAt: Timestamp.fromDate(new Date()),
      startedAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
      duration: 4,
      program_URL: "",
      routines: [],
    }

    const programRef2 = doc(db, "users", TEST_USER_ID, "programs", programId2)
    await setDoc(programRef2, program2)
    console.log("✅ Created program with Timestamp.fromDate()")

    // Test with ISO string
    const programId3 = "test-program-iso-string"
    const program3 = {
      id: programId3,
      name: "Test Program - ISO String",
      notes: "Testing with ISO string",
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      duration: 4,
      program_URL: "",
      routines: [],
    }

    const programRef3 = doc(db, "users", TEST_USER_ID, "programs", programId3)
    await setDoc(programRef3, program3)
    console.log("✅ Created program with ISO string")

    // Step 5: Read back and verify the stored formats
    console.log("\n🔍 Step 5: Reading back stored programs to verify formats")

    const storedProgram1 = await getDoc(programRef1)
    const storedProgram2 = await getDoc(programRef2)
    const storedProgram3 = await getDoc(programRef3)

    if (storedProgram1.exists()) {
      const data1 = storedProgram1.data()
      console.log("\n📋 Program 1 (Timestamp.now()) stored data:")
      console.log("createdAt:", data1.createdAt)
      console.log("createdAt type:", typeof data1.createdAt)
      console.log("createdAt constructor:", data1.createdAt?.constructor?.name)
      console.log("Has seconds:", !!data1.createdAt?.seconds)
      console.log("Has nanoseconds:", !!data1.createdAt?.nanoseconds)

      if (data1.createdAt?.toDate) {
        console.log("Can convert to Date:", data1.createdAt.toDate())
      }
    }

    if (storedProgram2.exists()) {
      const data2 = storedProgram2.data()
      console.log("\n📋 Program 2 (Timestamp.fromDate()) stored data:")
      console.log("createdAt:", data2.createdAt)
      console.log("createdAt type:", typeof data2.createdAt)
      console.log("createdAt constructor:", data2.createdAt?.constructor?.name)
      console.log("Has seconds:", !!data2.createdAt?.seconds)
      console.log("Has nanoseconds:", !!data2.createdAt?.nanoseconds)

      if (data2.createdAt?.toDate) {
        console.log("Can convert to Date:", data2.createdAt.toDate())
      }
    }

    if (storedProgram3.exists()) {
      const data3 = storedProgram3.data()
      console.log("\n📋 Program 3 (ISO String) stored data:")
      console.log("createdAt:", data3.createdAt)
      console.log("createdAt type:", typeof data3.createdAt)
      console.log("createdAt constructor:", data3.createdAt?.constructor?.name)
    }

    // Step 6: Test the actual program conversion service
    console.log("\n🔧 Step 6: Testing actual program conversion service")

    // Import and test the actual service
    const { programConversionService } = require("../lib/firebase/program-conversion-service.ts")

    const testProgramData = {
      program_title: "Debug Test Program",
      duration_weeks: 2,
      routines: [
        {
          name: "Upper Body",
          exercises: [
            {
              name: "Push-ups",
              sets: [
                { reps: "10", weight: "0", notes: "Bodyweight" },
                { reps: "10", weight: "0", notes: "Bodyweight" },
              ],
            },
          ],
        },
      ],
    }

    console.log("Calling programConversionService.sendProgramToClient...")
    const result = await programConversionService.sendProgramToClient(
      TEST_CLIENT_ID,
      testProgramData,
      "Debug test message",
    )

    console.log("✅ Program conversion result:", result)

    // Step 7: Verify the created program
    if (result.success && result.programId) {
      console.log("\n🔍 Step 7: Verifying created program")

      const createdProgramRef = doc(db, "users", TEST_USER_ID, "programs", result.programId)
      const createdProgramDoc = await getDoc(createdProgramRef)

      if (createdProgramDoc.exists()) {
        const createdData = createdProgramDoc.data()
        console.log("\n📋 Created program data:")
        console.log("Program ID:", result.programId)
        console.log("Program name:", createdData.name)

        console.log("\nTimestamp analysis:")
        console.log("createdAt:", createdData.createdAt)
        console.log("createdAt type:", typeof createdData.createdAt)
        console.log("createdAt constructor:", createdData.createdAt?.constructor?.name)
        console.log("Has seconds:", !!createdData.createdAt?.seconds)
        console.log("Has nanoseconds:", !!createdData.createdAt?.nanoseconds)

        console.log("\nstartedAt:", createdData.startedAt)
        console.log("startedAt type:", typeof createdData.startedAt)
        console.log("startedAt constructor:", createdData.startedAt?.constructor?.name)
        console.log("Has seconds:", !!createdData.startedAt?.seconds)
        console.log("Has nanoseconds:", !!createdData.startedAt?.nanoseconds)

        console.log("\nupdatedAt:", createdData.updatedAt)
        console.log("updatedAt type:", typeof createdData.updatedAt)
        console.log("updatedAt constructor:", createdData.updatedAt?.constructor?.name)
        console.log("Has seconds:", !!createdData.updatedAt?.seconds)
        console.log("Has nanoseconds:", !!createdData.updatedAt?.nanoseconds)

        console.log("\nRoutines count:", createdData.routines?.length || 0)

        // Check if we can access the routines
        if (createdData.routines && createdData.routines.length > 0) {
          console.log("First routine ID:", createdData.routines[0].routineId)

          // Try to fetch the first routine
          const routineRef = doc(db, "users", TEST_USER_ID, "routines", createdData.routines[0].routineId)
          const routineDoc = await getDoc(routineRef)

          if (routineDoc.exists()) {
            const routineData = routineDoc.data()
            console.log("\n🏋️ First routine data:")
            console.log("Routine name:", routineData.name)
            console.log("Routine createdAt:", routineData.createdAt)
            console.log("Routine createdAt type:", typeof routineData.createdAt)
            console.log("Routine createdAt constructor:", routineData.createdAt?.constructor?.name)
            console.log("Exercises count:", routineData.exercises?.length || 0)
          } else {
            console.log("❌ Routine document not found")
          }
        }
      } else {
        console.log("❌ Created program document not found")
      }
    }

    console.log("\n✅ === DEBUG COMPLETE ===")
  } catch (error) {
    console.error("❌ Debug script error:", error)
    console.error("Error stack:", error.stack)
  }
}

// Run the debug script
debugTimestampCreation()
  .then(() => {
    console.log("🎉 Debug script completed successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.error("💥 Debug script failed:", error)
    process.exit(1)
  })
