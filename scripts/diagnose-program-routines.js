const admin = require("firebase-admin")

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`,
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

const db = admin.firestore()

async function testProgramConversion() {
  try {
    console.log("🔍 === TESTING PROGRAM CONVERSION ===")

    // Test with the exact same data structure from the failed request
    const testProgramData = {
      name: "ivysaur test",
      program_title: "ivysaur test",
      description: "hello",
      duration_weeks: 4,
      is_periodized: false,
      routines: [
        {
          name: "Day 1",
          order: 1,
          exercises: [
            { name: "Bench", order: 1 },
            { name: "squat", order: 2 },
          ],
        },
        {
          order: 2,
          exercises: [],
        },
        {
          order: 3,
          name: "Day 3",
          exercises: [],
        },
      ],
      weeks: [],
    }

    const testUserId = "HN2QjNvnWKQ37nVXCSkhXdCwMEH2"

    console.log("📋 Test program data:", JSON.stringify(testProgramData, null, 2))
    console.log("👤 Test user ID:", testUserId)

    // Simulate the conversion logic
    console.log("\n🔄 === SIMULATING CONVERSION LOGIC ===")

    // Check if it's periodized
    const hasWeeks = testProgramData.weeks && Array.isArray(testProgramData.weeks)
    const hasRoutines = testProgramData.routines && Array.isArray(testProgramData.routines)

    console.log("📊 Program structure analysis:")
    console.log(`- hasWeeks: ${hasWeeks} (length: ${testProgramData.weeks?.length || 0})`)
    console.log(`- hasRoutines: ${hasRoutines} (length: ${testProgramData.routines?.length || 0})`)
    console.log(`- is_periodized: ${testProgramData.is_periodized}`)

    if (hasWeeks && testProgramData.weeks.length > 0) {
      console.log("📅 Would process as PERIODIZED program")
      for (let weekIndex = 0; weekIndex < testProgramData.weeks.length; weekIndex++) {
        const week = testProgramData.weeks[weekIndex]
        console.log(`Week ${weekIndex + 1}:`, week)
      }
    } else if (hasRoutines && testProgramData.routines.length > 0) {
      console.log("📝 Would process as NON-PERIODIZED program")
      const totalWeeks = testProgramData.program_weeks || testProgramData.duration_weeks || 1
      console.log(`Total weeks to create: ${totalWeeks}`)

      for (let week = 1; week <= totalWeeks; week++) {
        console.log(`\n--- Week ${week} ---`)
        for (let routineIndex = 0; routineIndex < testProgramData.routines.length; routineIndex++) {
          const routine = testProgramData.routines[routineIndex]
          console.log(`Routine ${routineIndex + 1}:`, {
            name: routine.name || `Routine ${routineIndex + 1}`,
            exercises: routine.exercises?.length || 0,
            hasExercises: routine.exercises && Array.isArray(routine.exercises),
            exerciseDetails: routine.exercises,
          })

          // Check if routine has valid exercises
          if (!routine.exercises || !Array.isArray(routine.exercises)) {
            console.log(`❌ Routine ${routineIndex + 1} has invalid exercises structure`)
          } else if (routine.exercises.length === 0) {
            console.log(`⚠️ Routine ${routineIndex + 1} has no exercises`)
          } else {
            console.log(`✅ Routine ${routineIndex + 1} has ${routine.exercises.length} exercises`)
          }
        }
      }
    } else {
      console.log("❌ No valid program structure found")
    }

    // Check existing user data
    console.log("\n👤 === CHECKING USER DATA ===")
    const userDoc = await db.collection("users").doc(testUserId).get()
    if (userDoc.exists()) {
      console.log("✅ User document exists")
      const userData = userDoc.data()
      console.log("User data:", {
        name: userData.name,
        email: userData.email,
        status: userData.status,
      })
    } else {
      console.log("❌ User document does not exist")
    }

    // Check user's existing programs and routines
    const programsSnapshot = await db.collection("users").doc(testUserId).collection("programs").get()
    const routinesSnapshot = await db.collection("users").doc(testUserId).collection("routines").get()

    console.log(`📊 User currently has:`)
    console.log(`- ${programsSnapshot.size} programs`)
    console.log(`- ${routinesSnapshot.size} routines`)

    console.log("\n✅ === DIAGNOSIS COMPLETE ===")
  } catch (error) {
    console.error("❌ Error during test:", error)
  }
}

// Run the test
testProgramConversion()
  .then(() => {
    console.log("🏁 Test finished")
    process.exit(0)
  })
  .catch((error) => {
    console.error("💥 Test failed:", error)
    process.exit(1)
  })
