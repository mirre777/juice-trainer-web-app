const { initializeApp } = require("firebase/app")
const { getFirestore, collection, doc, setDoc, getDoc, Timestamp, serverTimestamp } = require("firebase/firestore")

// Firebase config (you'll need to add your actual config)
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function diagnoseTimestampStorage() {
  console.log("🔍 === COMPREHENSIVE TIMESTAMP DIAGNOSIS ===")

  const testUserId = "test-user-timestamp-diagnosis"
  const testProgramId = "test-program-timestamp-diagnosis"

  try {
    // Test 1: Create timestamps using different methods
    console.log("\n📝 Test 1: Creating different timestamp types")

    const timestampNow = Timestamp.now()
    const serverTimestampValue = serverTimestamp()
    const dateNow = new Date()
    const isoString = new Date().toISOString()

    console.log("Timestamp.now():", timestampNow)
    console.log("Type:", typeof timestampNow)
    console.log("Has seconds:", !!timestampNow.seconds)
    console.log("Has nanoseconds:", !!timestampNow.nanoseconds)
    console.log("Constructor:", timestampNow.constructor.name)

    console.log("\nserverTimestamp():", serverTimestampValue)
    console.log("Type:", typeof serverTimestampValue)
    console.log("Constructor:", serverTimestampValue.constructor.name)

    // Test 2: Create a test program with different timestamp approaches
    console.log("\n📝 Test 2: Testing program creation with Timestamp.now()")

    const programWithTimestampNow = {
      id: testProgramId + "-timestamp-now",
      name: "Test Program - Timestamp.now()",
      notes: "Testing timestamp storage",
      createdAt: timestampNow,
      startedAt: timestampNow,
      updatedAt: timestampNow,
      duration: 4,
      program_URL: "",
      routines: [],
    }

    console.log("Program object before saving:")
    console.log("createdAt:", programWithTimestampNow.createdAt)
    console.log("createdAt type:", typeof programWithTimestampNow.createdAt)
    console.log("createdAt constructor:", programWithTimestampNow.createdAt.constructor.name)

    // Save to Firestore
    const programRef1 = doc(db, "users", testUserId, "programs", testProgramId + "-timestamp-now")
    await setDoc(programRef1, programWithTimestampNow)
    console.log("✅ Saved program with Timestamp.now()")

    // Read it back
    const savedDoc1 = await getDoc(programRef1)
    if (savedDoc1.exists()) {
      const savedData1 = savedDoc1.data()
      console.log("\n📖 Retrieved data:")
      console.log("createdAt:", savedData1.createdAt)
      console.log("createdAt type:", typeof savedData1.createdAt)
      console.log("createdAt constructor:", savedData1.createdAt?.constructor?.name)
      console.log("Has seconds:", !!savedData1.createdAt?.seconds)
      console.log("Has nanoseconds:", !!savedData1.createdAt?.nanoseconds)
      console.log("Is Timestamp instance:", savedData1.createdAt instanceof Timestamp)
    }

    // Test 3: Create program with serverTimestamp()
    console.log("\n📝 Test 3: Testing program creation with serverTimestamp()")

    const programWithServerTimestamp = {
      id: testProgramId + "-server-timestamp",
      name: "Test Program - serverTimestamp()",
      notes: "Testing server timestamp storage",
      createdAt: serverTimestamp(),
      startedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      duration: 4,
      program_URL: "",
      routines: [],
    }

    const programRef2 = doc(db, "users", testUserId, "programs", testProgramId + "-server-timestamp")
    await setDoc(programRef2, programWithServerTimestamp)
    console.log("✅ Saved program with serverTimestamp()")

    // Read it back
    const savedDoc2 = await getDoc(programRef2)
    if (savedDoc2.exists()) {
      const savedData2 = savedDoc2.data()
      console.log("\n📖 Retrieved data:")
      console.log("createdAt:", savedData2.createdAt)
      console.log("createdAt type:", typeof savedData2.createdAt)
      console.log("createdAt constructor:", savedData2.createdAt?.constructor?.name)
      console.log("Has seconds:", !!savedData2.createdAt?.seconds)
      console.log("Has nanoseconds:", !!savedData2.createdAt?.nanoseconds)
      console.log("Is Timestamp instance:", savedData2.createdAt instanceof Timestamp)
    }

    // Test 4: Test with nested object (like your actual program structure)
    console.log("\n📝 Test 4: Testing with nested structure (simulating batch operation)")

    const nestedProgram = {
      id: testProgramId + "-nested",
      name: "Test Program - Nested",
      notes: "",
      createdAt: Timestamp.now(),
      startedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      duration: 4,
      program_URL: "",
      routines: [
        {
          routineId: "routine-1",
          week: 1,
          order: 1,
        },
      ],
    }

    // Simulate the removeUndefinedValues function
    function removeUndefinedValues(obj) {
      if (obj === null || obj === undefined) {
        return null
      }

      if (Array.isArray(obj)) {
        return obj.map((item) => removeUndefinedValues(item))
      }

      if (typeof obj === "object") {
        const cleaned = {}
        for (const [key, value] of Object.entries(obj)) {
          if (value !== undefined) {
            cleaned[key] = removeUndefinedValues(value)
          }
        }
        return cleaned
      }

      return obj
    }

    const cleanedProgram = removeUndefinedValues(nestedProgram)
    console.log("Program after removeUndefinedValues:")
    console.log("createdAt:", cleanedProgram.createdAt)
    console.log("createdAt type:", typeof cleanedProgram.createdAt)
    console.log("createdAt constructor:", cleanedProgram.createdAt?.constructor?.name)

    const programRef3 = doc(db, "users", testUserId, "programs", testProgramId + "-nested")
    await setDoc(programRef3, cleanedProgram)
    console.log("✅ Saved cleaned program")

    // Read it back
    const savedDoc3 = await getDoc(programRef3)
    if (savedDoc3.exists()) {
      const savedData3 = savedDoc3.data()
      console.log("\n📖 Retrieved cleaned data:")
      console.log("createdAt:", savedData3.createdAt)
      console.log("createdAt type:", typeof savedData3.createdAt)
      console.log("createdAt constructor:", savedData3.createdAt?.constructor?.name)
      console.log("Has seconds:", !!savedData3.createdAt?.seconds)
      console.log("Has nanoseconds:", !!savedData3.createdAt?.nanoseconds)
      console.log("Is Timestamp instance:", savedData3.createdAt instanceof Timestamp)
    }

    // Test 5: Test JSON serialization (potential issue)
    console.log("\n📝 Test 5: Testing JSON serialization effects")

    const originalTimestamp = Timestamp.now()
    console.log("Original timestamp:", originalTimestamp)
    console.log("Original type:", typeof originalTimestamp)

    const jsonString = JSON.stringify({ timestamp: originalTimestamp })
    console.log("JSON string:", jsonString)

    const parsed = JSON.parse(jsonString)
    console.log("Parsed timestamp:", parsed.timestamp)
    console.log("Parsed type:", typeof parsed.timestamp)
    console.log("Lost Timestamp type:", !(parsed.timestamp instanceof Timestamp))

    // Test 6: Test with writeBatch (like your actual implementation)
    console.log("\n📝 Test 6: Testing with writeBatch")

    const { writeBatch } = require("firebase/firestore")
    const batch = writeBatch(db)

    const batchProgram = {
      id: testProgramId + "-batch",
      name: "Test Program - Batch",
      notes: "",
      createdAt: Timestamp.now(),
      startedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      duration: 4,
      program_URL: "",
      routines: [],
    }

    console.log("Batch program before adding to batch:")
    console.log("createdAt:", batchProgram.createdAt)
    console.log("createdAt type:", typeof batchProgram.createdAt)

    const programRef4 = doc(db, "users", testUserId, "programs", testProgramId + "-batch")
    batch.set(programRef4, batchProgram)

    await batch.commit()
    console.log("✅ Committed batch")

    // Read it back
    const savedDoc4 = await getDoc(programRef4)
    if (savedDoc4.exists()) {
      const savedData4 = savedDoc4.data()
      console.log("\n📖 Retrieved batch data:")
      console.log("createdAt:", savedData4.createdAt)
      console.log("createdAt type:", typeof savedData4.createdAt)
      console.log("createdAt constructor:", savedData4.createdAt?.constructor?.name)
      console.log("Has seconds:", !!savedData4.createdAt?.seconds)
      console.log("Has nanoseconds:", !!savedData4.createdAt?.nanoseconds)
      console.log("Is Timestamp instance:", savedData4.createdAt instanceof Timestamp)
    }

    // Test 7: Check what happens in your exact code path
    console.log("\n📝 Test 7: Simulating your exact code path")

    // Simulate your exact program creation
    const now = Timestamp.now()
    const programData = {
      program_title: "Test Program",
      weeks: [
        {
          week_number: 1,
          routines: [
            {
              name: "Test Routine",
              exercises: [
                {
                  name: "Test Exercise",
                  sets: [{ reps: "10", weight: "100" }],
                },
              ],
            },
          ],
        },
      ],
    }

    const program = {
      id: testProgramId + "-exact",
      name: programData.program_title || "Imported Program",
      notes: "",
      createdAt: now,
      startedAt: now,
      updatedAt: now,
      duration: 4,
      program_URL: "",
      routines: [],
    }

    console.log("Program in exact simulation:")
    console.log("createdAt:", program.createdAt)
    console.log("createdAt type:", typeof program.createdAt)
    console.log("createdAt instanceof Timestamp:", program.createdAt instanceof Timestamp)

    const cleanedExact = removeUndefinedValues(program)
    console.log("After removeUndefinedValues:")
    console.log("createdAt:", cleanedExact.createdAt)
    console.log("createdAt type:", typeof cleanedExact.createdAt)
    console.log("createdAt instanceof Timestamp:", cleanedExact.createdAt instanceof Timestamp)

    const exactBatch = writeBatch(db)
    const programRef5 = doc(db, "users", testUserId, "programs", testProgramId + "-exact")
    exactBatch.set(programRef5, cleanedExact)

    await exactBatch.commit()
    console.log("✅ Committed exact simulation")

    // Read it back
    const savedDoc5 = await getDoc(programRef5)
    if (savedDoc5.exists()) {
      const savedData5 = savedDoc5.data()
      console.log("\n📖 Retrieved exact simulation data:")
      console.log("createdAt:", savedData5.createdAt)
      console.log("createdAt type:", typeof savedData5.createdAt)
      console.log("createdAt constructor:", savedData5.createdAt?.constructor?.name)
      console.log("Has seconds:", !!savedData5.createdAt?.seconds)
      console.log("Has nanoseconds:", !!savedData5.createdAt?.nanoseconds)
      console.log("Is Timestamp instance:", savedData5.createdAt instanceof Timestamp)

      // Check if it's being stored as a different format
      console.log("Raw createdAt value:", JSON.stringify(savedData5.createdAt))
    }

    console.log("\n🎯 === DIAGNOSIS COMPLETE ===")
    console.log("Check the results above to identify where timestamps are being converted")
  } catch (error) {
    console.error("❌ Error during diagnosis:", error)
    console.error("Stack trace:", error.stack)
  }
}

// Run the diagnosis
diagnoseTimestampStorage()
  .then(() => {
    console.log("✅ Diagnosis completed")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Diagnosis failed:", error)
    process.exit(1)
  })
