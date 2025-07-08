// Simple diagnostic script for program conversion issues
const { initializeApp } = require("firebase/app")
const { getFirestore, collection, doc, getDoc, getDocs, query, where } = require("firebase/firestore")

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

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function diagnoseProgramIssue() {
  console.log("🔍 === PROGRAM CONVERSION DIAGNOSIS ===\n")

  try {
    // Test data from the failed request
    const testClientId = "CGLJmpv59IngpsYpW7PZ"
    const testUserId = "HN2QjNvnWKQ37nVXCSkhXdCwMEH2" // From the screenshots
    const trainerId = "5tVdK6LXCifZgjxD7rml3nEOXmh1"

    console.log("📋 Test Parameters:")
    console.log(`- Client ID: ${testClientId}`)
    console.log(`- User ID: ${testUserId}`)
    console.log(`- Trainer ID: ${trainerId}\n`)

    // 1. Check if client document exists
    console.log("1️⃣ Checking client document...")
    const clientDocRef = doc(db, "users", trainerId, "clients", testClientId)
    const clientDoc = await getDoc(clientDocRef)

    if (clientDoc.exists()) {
      const clientData = clientDoc.data()
      console.log("✅ Client document exists")
      console.log(`   - Name: ${clientData.name}`)
      console.log(`   - Email: ${clientData.email}`)
      console.log(`   - Status: ${clientData.status}`)
      console.log(`   - User ID: ${clientData.userId}`)
      console.log(`   - Has Linked Account: ${clientData.hasLinkedAccount}\n`)
    } else {
      console.log("❌ Client document does NOT exist\n")
      return
    }

    // 2. Check if user document exists
    console.log("2️⃣ Checking user document...")
    const userDocRef = doc(db, "users", testUserId)
    const userDoc = await getDoc(userDocRef)

    if (userDoc.exists()) {
      const userData = userDoc.data()
      console.log("✅ User document exists")
      console.log(`   - Name: ${userData.name}`)
      console.log(`   - Email: ${userData.email}`)
      console.log(`   - Status: ${userData.status}\n`)
    } else {
      console.log("❌ User document does NOT exist\n")
      return
    }

    // 3. Check existing programs and routines
    console.log("3️⃣ Checking existing programs and routines...")
    const programsRef = collection(db, "users", testUserId, "programs")
    const routinesRef = collection(db, "users", testUserId, "routines")

    const programsSnapshot = await getDocs(programsRef)
    const routinesSnapshot = await getDocs(routinesRef)

    console.log(`📊 Current state:`)
    console.log(`   - Programs: ${programsSnapshot.size}`)
    console.log(`   - Routines: ${routinesSnapshot.size}\n`)

    // 4. Check if test exercises exist
    console.log("4️⃣ Checking test exercises...")
    const testExercises = ["Bench", "squat"]

    for (const exerciseName of testExercises) {
      console.log(`🏋️ Checking "${exerciseName}":`)

      // Check global exercises
      const globalQuery = query(collection(db, "exercises"), where("name", "==", exerciseName))
      const globalSnapshot = await getDocs(globalQuery)
      console.log(`   - Global: ${globalSnapshot.size} matches`)

      // Check user exercises
      const userExercisesQuery = query(
        collection(db, "users", testUserId, "exercises"),
        where("name", "==", exerciseName),
      )
      const userExercisesSnapshot = await getDocs(userExercisesQuery)
      console.log(`   - User custom: ${userExercisesSnapshot.size} matches`)
    }

    console.log("\n5️⃣ Program structure analysis:")
    const testProgram = {
      name: "ivysaur test",
      is_periodized: false,
      duration_weeks: 4,
      routines: [
        { name: "Day 1", exercises: [{ name: "Bench" }, { name: "squat" }] },
        { exercises: [] },
        { name: "Day 3", exercises: [] },
      ],
    }

    console.log("📝 Test program structure:")
    console.log(`   - Name: ${testProgram.name}`)
    console.log(`   - Periodized: ${testProgram.is_periodized}`)
    console.log(`   - Duration: ${testProgram.duration_weeks} weeks`)
    console.log(`   - Routines: ${testProgram.routines.length}`)

    testProgram.routines.forEach((routine, index) => {
      console.log(`   - Routine ${index + 1}: "${routine.name || "Unnamed"}" (${routine.exercises.length} exercises)`)
    })

    console.log("\n✅ === DIAGNOSIS COMPLETE ===")
    console.log("\n🔍 Key findings:")
    console.log("- Check if all client/user documents exist")
    console.log("- Verify exercises can be found or created")
    console.log("- Note that some routines have empty exercises arrays")
    console.log('- This might be causing the "No routines were created" error')
  } catch (error) {
    console.error("❌ Error during diagnosis:", error)
  }
}

// Run the diagnosis
diagnoseProgramIssue()
  .then(() => {
    console.log("\n🏁 Diagnosis complete")
    process.exit(0)
  })
  .catch((error) => {
    console.error("💥 Diagnosis failed:", error)
    process.exit(1)
  })
