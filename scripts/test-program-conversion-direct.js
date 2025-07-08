import { initializeApp } from "firebase/app"
import { getFirestore, doc, getDoc, setDoc, collection } from "firebase/firestore"
import { v4 as uuidv4 } from "uuid"

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

console.log("🔧 Firebase Config Check:")
console.log("  - API Key:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "✅ Present" : "❌ Missing")
console.log("  - Auth Domain:", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "✅ Present" : "❌ Missing")
console.log("  - Project ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "✅ Present" : "❌ Missing")
console.log("")

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

console.log("🚀 === DIRECT PROGRAM CONVERSION TEST ===")
console.log("📋 Test Parameters:")
console.log("  - Trainer ID: 5tVdK6LXCifZgjxD7rml3nEOXmh1")
console.log("  - Client ID: CGLJmpv59IngpsYpW7PZ")
console.log("  - User ID: HN2QjNvnWKQ37nVXCSkhXdCwMEH2")
console.log("")

// Test program data - simple structure
const testProgramData = {
  program_title: "Test Program - Direct Push",
  program_notes: "Testing direct program conversion without UI",
  program_weeks: 1,
  routines: [
    {
      routine_name: "Day 1 - Test Workout",
      notes: "Simple test workout",
      exercises: [
        {
          name: "Push-ups",
          notes: "Basic exercise",
          sets: [
            {
              set_number: 1,
              reps: "10",
              weight: "bodyweight",
              rpe: "7",
              rest: "1min",
              notes: "Test set",
              warmup: false,
              set_type: "normal",
            },
          ],
        },
      ],
    },
  ],
}

async function testDocumentAccess() {
  console.log("🔍 === TESTING DOCUMENT ACCESS ===")

  const trainerId = "5tVdK6LXCifZgjxD7rml3nEOXmh1"
  const clientId = "CGLJmpv59IngpsYpW7PZ"
  const userId = "HN2QjNvnWKQ37nVXCSkhXdCwMEH2"

  try {
    // Test 1: Check trainer document
    console.log("📄 Test 1: Checking trainer document...")
    const trainerDocRef = doc(db, "users", trainerId)
    const trainerDoc = await getDoc(trainerDocRef)

    if (trainerDoc.exists()) {
      console.log("✅ Trainer document EXISTS")
      const trainerData = trainerDoc.data()
      console.log("  - Name:", trainerData.name || "No name")
      console.log("  - Email:", trainerData.email || "No email")
    } else {
      console.log("❌ Trainer document does NOT exist")
    }

    // Test 2: Check client document
    console.log("")
    console.log("📄 Test 2: Checking client document...")
    const clientDocRef = doc(db, "users", trainerId, "clients", clientId)
    const clientDoc = await getDoc(clientDocRef)

    if (clientDoc.exists()) {
      console.log("✅ Client document EXISTS")
      const clientData = clientDoc.data()
      console.log("  - Name:", clientData.name || "No name")
      console.log("  - Email:", clientData.email || "No email")
      console.log("  - Status:", clientData.status || "No status")
      console.log("  - UserId:", clientData.userId || "No userId")
      console.log("  - IsTemporary:", clientData.isTemporary || false)
    } else {
      console.log("❌ Client document does NOT exist")
      console.log("  - Path checked: users/" + trainerId + "/clients/" + clientId)
    }

    // Test 3: Check user document
    console.log("")
    console.log("📄 Test 3: Checking user document...")
    const userDocRef = doc(db, "users", userId)
    const userDoc = await getDoc(userDocRef)

    if (userDoc.exists()) {
      console.log("✅ User document EXISTS")
      const userData = userDoc.data()
      console.log("  - Name:", userData.name || "No name")
      console.log("  - Email:", userData.email || "No email")
      console.log("  - Status:", userData.status || "No status")
      console.log("  - HasFirebaseAuth:", userData.hasFirebaseAuth || false)
      console.log("  - Trainers:", userData.trainers || [])
    } else {
      console.log("❌ User document does NOT exist")
      console.log("  - Path checked: users/" + userId)
    }

    return { trainerExists: trainerDoc.exists(), clientExists: clientDoc.exists(), userExists: userDoc.exists() }
  } catch (error) {
    console.error("❌ Error accessing documents:", error)
    return { trainerExists: false, clientExists: false, userExists: false }
  }
}

async function testProgramCreation() {
  console.log("")
  console.log("🚀 === TESTING PROGRAM CREATION ===")

  const userId = "HN2QjNvnWKQ37nVXCSkhXdCwMEH2"

  try {
    // Create a simple program directly
    const programId = uuidv4()
    const timestamp = new Date()

    console.log("📝 Creating program with ID:", programId)

    const program = {
      id: programId,
      name: testProgramData.program_title,
      notes: testProgramData.program_notes,
      startedAt: timestamp.toISOString(),
      duration: testProgramData.program_weeks,
      createdAt: timestamp.toISOString(),
      updated_at: timestamp.toISOString(),
      routines: [],
    }

    // Create program document
    const programsRef = collection(db, "users", userId, "programs")
    const programDocRef = doc(programsRef, programId)

    console.log("💾 Saving program to path: users/" + userId + "/programs/" + programId)
    await setDoc(programDocRef, program)

    console.log("✅ Program created successfully!")
    console.log("  - Program ID:", programId)
    console.log("  - Path: users/" + userId + "/programs/" + programId)

    // Verify it was created
    console.log("")
    console.log("🔍 Verifying program was saved...")
    const savedProgramDoc = await getDoc(programDocRef)

    if (savedProgramDoc.exists()) {
      console.log("✅ Program verification SUCCESS")
      const savedData = savedProgramDoc.data()
      console.log("  - Saved name:", savedData.name)
      console.log("  - Saved duration:", savedData.duration)
      console.log("  - Created at:", savedData.createdAt)
    } else {
      console.log("❌ Program verification FAILED - document not found after creation")
    }

    return programId
  } catch (error) {
    console.error("❌ Error creating program:", error)
    console.error("  - Error code:", error.code)
    console.error("  - Error message:", error.message)

    if (error.code === "permission-denied") {
      console.error("🔒 PERMISSION DENIED - Check Firestore security rules")
    }

    return null
  }
}

async function runFullTest() {
  console.log("🎯 === STARTING FULL DIAGNOSTIC TEST ===")
  console.log("")

  // Step 1: Test document access
  const accessResults = await testDocumentAccess()

  console.log("")
  console.log("📊 === ACCESS RESULTS SUMMARY ===")
  console.log("  - Trainer document:", accessResults.trainerExists ? "✅ EXISTS" : "❌ MISSING")
  console.log("  - Client document:", accessResults.clientExists ? "✅ EXISTS" : "❌ MISSING")
  console.log("  - User document:", accessResults.userExists ? "✅ EXISTS" : "❌ MISSING")

  if (!accessResults.userExists) {
    console.log("")
    console.log("🛑 STOPPING TEST - User document is required for program creation")
    return
  }

  // Step 2: Test program creation
  const programId = await testProgramCreation()

  if (programId) {
    console.log("")
    console.log("🎉 === TEST COMPLETED SUCCESSFULLY ===")
    console.log("✅ Program created with ID:", programId)
    console.log("🔍 Check Firebase console at:")
    console.log("  - users/HN2QjNvnWKQ37nVXCSkhXdCwMEH2/programs/" + programId)
  } else {
    console.log("")
    console.log("❌ === TEST FAILED ===")
    console.log("Program creation failed - check error messages above")
  }
}

// Run the full test
runFullTest()
