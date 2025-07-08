// Debug script to compare program structures and help identify why programs aren't showing in mobile app

const admin = require("firebase-admin")

// Initialize Firebase Admin (you'll need to set up your service account)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    // Add your Firebase config here
  })
}

const db = admin.firestore()

async function debugProgramVisibility() {
  console.log("🔍 === DEBUGGING PROGRAM VISIBILITY ===")

  try {
    // Compare the working user (8oga...) with non-working user (HN2Q...)
    const workingUserId = "8ogaYAb7xAQp022wfJCowAiWnHB2" // From your screenshots
    const nonWorkingUserId = "HN2QjNvnWKQ37nVXCSkhXdCwMEH2" // Mirre's user ID

    console.log("\n📊 WORKING USER PROGRAMS:")
    const workingPrograms = await db.collection("users").doc(workingUserId).collection("programs").get()

    workingPrograms.forEach((doc, index) => {
      const data = doc.data()
      console.log(`\nWorking Program ${index + 1}:`)
      console.log("Document ID:", doc.id)
      console.log("Fields and types:")
      Object.keys(data).forEach((key) => {
        console.log(`  ${key}: ${typeof data[key]} = ${JSON.stringify(data[key])}`)
      })
    })

    console.log("\n📊 NON-WORKING USER PROGRAMS:")
    const nonWorkingPrograms = await db.collection("users").doc(nonWorkingUserId).collection("programs").get()

    nonWorkingPrograms.forEach((doc, index) => {
      const data = doc.data()
      console.log(`\nNon-Working Program ${index + 1}:`)
      console.log("Document ID:", doc.id)
      console.log("Fields and types:")
      Object.keys(data).forEach((key) => {
        console.log(`  ${key}: ${typeof data[key]} = ${JSON.stringify(data[key])}`)
      })
    })

    // Compare field differences
    console.log("\n🔍 FIELD COMPARISON:")
    if (workingPrograms.size > 0 && nonWorkingPrograms.size > 0) {
      const workingData = workingPrograms.docs[0].data()
      const nonWorkingData = nonWorkingPrograms.docs[0].data()

      const workingFields = Object.keys(workingData)
      const nonWorkingFields = Object.keys(nonWorkingData)

      console.log(
        "Fields only in working program:",
        workingFields.filter((f) => !nonWorkingFields.includes(f)),
      )
      console.log(
        "Fields only in non-working program:",
        nonWorkingFields.filter((f) => !workingFields.includes(f)),
      )

      // Compare common fields
      const commonFields = workingFields.filter((f) => nonWorkingFields.includes(f))
      console.log("\nCommon fields with different values:")
      commonFields.forEach((field) => {
        const workingValue = workingData[field]
        const nonWorkingValue = nonWorkingData[field]

        if (JSON.stringify(workingValue) !== JSON.stringify(nonWorkingValue)) {
          console.log(`  ${field}:`)
          console.log(`    Working: ${typeof workingValue} = ${JSON.stringify(workingValue)}`)
          console.log(`    Non-working: ${typeof nonWorkingValue} = ${JSON.stringify(nonWorkingValue)}`)
        }
      })
    }

    // Check routines as well
    console.log("\n📊 CHECKING ROUTINES:")

    console.log("\nWorking user routines:")
    const workingRoutines = await db.collection("users").doc(workingUserId).collection("routines").limit(3).get()
    workingRoutines.forEach((doc, index) => {
      const data = doc.data()
      console.log(`Working Routine ${index + 1}:`, {
        id: doc.id,
        name: data.name,
        type: data.type,
        deletedAt: data.deletedAt,
        exerciseCount: data.exercises?.length || 0,
      })
    })

    console.log("\nNon-working user routines:")
    const nonWorkingRoutines = await db.collection("users").doc(nonWorkingUserId).collection("routines").limit(3).get()
    nonWorkingRoutines.forEach((doc, index) => {
      const data = doc.data()
      console.log(`Non-Working Routine ${index + 1}:`, {
        id: doc.id,
        name: data.name,
        type: data.type,
        deletedAt: data.deletedAt,
        exerciseCount: data.exercises?.length || 0,
      })
    })
  } catch (error) {
    console.error("Error debugging programs:", error)
  }
}

// Run the debug function
debugProgramVisibility()
