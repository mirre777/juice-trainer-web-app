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

async function diagnoseProgramRoutines() {
  try {
    console.log("🔍 === DIAGNOSING PROGRAM ROUTINES ===")

    const userId = "HN2QjNvnWKQ37nVXCSkhXdCwMEH2"
    const programId = "3cbb183b-8146-43f4-b044-d67a679ad29e"

    console.log(`👤 User ID: ${userId}`)
    console.log(`📋 Program ID: ${programId}`)

    // 1. Check if program document exists
    console.log("\n📋 === CHECKING PROGRAM DOCUMENT ===")
    const programRef = db.collection("users").doc(userId).collection("programs").doc(programId)
    const programDoc = await programRef.get()

    if (!programDoc.exists) {
      console.log("❌ Program document does not exist")
      return
    }

    const programData = programDoc.data()
    console.log("✅ Program document exists")
    console.log("📊 Program data:", {
      id: programData.id,
      name: programData.name,
      duration: programData.duration,
      routinesCount: programData.routines?.length || 0,
      createdAt: programData.createdAt,
      startedAt: programData.startedAt,
      updatedAt: programData.updatedAt,
      notes: programData.notes,
      program_URL: programData.program_URL,
    })

    // 2. Check each routine document
    console.log("\n🏋️ === CHECKING ROUTINE DOCUMENTS ===")
    if (!programData.routines || programData.routines.length === 0) {
      console.log("❌ Program has no routines array or it is empty")
      return
    }

    console.log(`📝 Program references ${programData.routines.length} routines:`)

    for (let i = 0; i < programData.routines.length; i++) {
      const routineRef = programData.routines[i]
      console.log(`\n--- Routine ${i + 1} ---`)
      console.log("📋 Routine reference:", routineRef)

      // Check if routine document exists
      const routineDocRef = db.collection("users").doc(userId).collection("routines").doc(routineRef.routineId)
      const routineDoc = await routineDocRef.get()

      if (!routineDoc.exists) {
        console.log(`❌ Routine document ${routineRef.routineId} does NOT exist`)
        console.log(`🔍 Expected path: users/${userId}/routines/${routineRef.routineId}`)
        continue
      }

      const routineData = routineDoc.data()
      console.log(`✅ Routine document ${routineRef.routineId} exists`)
      console.log("📊 Routine data:", {
        id: routineData.id,
        name: routineData.name,
        type: routineData.type,
        exercisesCount: routineData.exercises?.length || 0,
        createdAt: routineData.createdAt,
        updatedAt: routineData.updatedAt,
        deletedAt: routineData.deletedAt,
        notes: routineData.notes,
      })

      // Check exercises in routine
      if (routineData.exercises && routineData.exercises.length > 0) {
        console.log(`🏋️ Routine has ${routineData.exercises.length} exercises:`)
        routineData.exercises.forEach((exercise, idx) => {
          console.log(`  ${idx + 1}. ${exercise.name} (${exercise.sets?.length || 0} sets)`)
        })
      } else {
        console.log("⚠️ Routine has no exercises")
      }
    }

    // 3. Check all programs for this user to compare
    console.log("\n📚 === CHECKING ALL USER PROGRAMS ===")
    const allProgramsRef = db.collection("users").doc(userId).collection("programs")
    const allProgramsSnapshot = await allProgramsRef.get()

    console.log(`📊 User has ${allProgramsSnapshot.size} total programs:`)

    allProgramsSnapshot.forEach((doc, index) => {
      const data = doc.data()
      console.log(`${index + 1}. ${doc.id}:`)
      console.log(`   Name: ${data.name}`)
      console.log(`   Duration: ${data.duration}`)
      console.log(`   Routines: ${data.routines?.length || 0}`)
      console.log(`   Created: ${data.createdAt?.toDate?.() || data.createdAt}`)
      console.log(
        `   Type: ${typeof data.createdAt} (${data.createdAt instanceof admin.firestore.Timestamp ? "Timestamp" : "Other"})`,
      )
    })

    // 4. Check all routines for this user
    console.log("\n🏋️ === CHECKING ALL USER ROUTINES ===")
    const allRoutinesRef = db.collection("users").doc(userId).collection("routines")
    const allRoutinesSnapshot = await allRoutinesRef.get()

    console.log(`📊 User has ${allRoutinesSnapshot.size} total routines:`)

    allRoutinesSnapshot.forEach((doc, index) => {
      const data = doc.data()
      console.log(`${index + 1}. ${doc.id}:`)
      console.log(`   Name: ${data.name}`)
      console.log(`   Type: ${data.type}`)
      console.log(`   Exercises: ${data.exercises?.length || 0}`)
      console.log(`   Created: ${data.createdAt}`)
      console.log(`   Deleted: ${data.deletedAt}`)
    })

    // 5. Compare with working program structure
    console.log("\n🔍 === COMPARING WITH WORKING PROGRAM STRUCTURE ===")
    console.log("Expected mobile app program structure:")
    console.log("- id: string")
    console.log("- name: string")
    console.log("- notes: string (empty string, not null)")
    console.log("- duration: number")
    console.log("- createdAt: Firestore Timestamp")
    console.log("- startedAt: Firestore Timestamp")
    console.log("- updatedAt: Firestore Timestamp (not updated_at)")
    console.log("- program_URL: string (empty string, not null)")
    console.log("- routines: Array<{routineId: string, week: number, order: number}>")

    console.log("\nExpected mobile app routine structure:")
    console.log("- id: string")
    console.log("- name: string")
    console.log("- notes: string")
    console.log('- type: "program"')
    console.log("- createdAt: ISO string")
    console.log("- updatedAt: ISO string")
    console.log("- deletedAt: null")
    console.log("- exercises: Array<{id: string, name: string, sets: Array}>")

    console.log("\n✅ === DIAGNOSIS COMPLETE ===")
  } catch (error) {
    console.error("❌ Error during diagnosis:", error)
  }
}

// Run the diagnosis
diagnoseProgramRoutines()
  .then(() => {
    console.log("🏁 Diagnosis finished")
    process.exit(0)
  })
  .catch((error) => {
    console.error("💥 Diagnosis failed:", error)
    process.exit(1)
  })
