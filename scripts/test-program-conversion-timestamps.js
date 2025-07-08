const { initializeApp } = require("firebase/app")
const { getFirestore, doc, getDoc } = require("firebase/firestore")

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

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function testProgramConversionTimestamps() {
  try {
    console.log("=== TESTING PROGRAM CONVERSION SERVICE TIMESTAMPS ===")

    // Import the program conversion service
    const { programConversionService } = await import("../lib/firebase/program-conversion-service.js")

    // Test data - simple program
    const testProgramData = {
      name: "Timestamp Test Program",
      program_title: "Timestamp Test Program",
      duration_weeks: 2,
      routines: [
        {
          name: "Day 1 - Upper Body",
          exercises: [
            {
              name: "Push-ups",
              sets: [
                { reps: "10", weight: "", notes: "Bodyweight" },
                { reps: "10", weight: "", notes: "Bodyweight" },
                { reps: "10", weight: "", notes: "Bodyweight" },
              ],
            },
            {
              name: "Pull-ups",
              sets: [
                { reps: "5", weight: "", notes: "Assisted if needed" },
                { reps: "5", weight: "", notes: "Assisted if needed" },
              ],
            },
          ],
        },
        {
          name: "Day 2 - Lower Body",
          exercises: [
            {
              name: "Squats",
              sets: [
                { reps: "15", weight: "bodyweight", notes: "" },
                { reps: "15", weight: "bodyweight", notes: "" },
                { reps: "15", weight: "bodyweight", notes: "" },
              ],
            },
          ],
        },
      ],
    }

    // Test client ID (from your example)
    const testClientId = "0fae9e0d-601b-404d-b841-7d34af9b3687"

    console.log("Test Client ID:", testClientId)
    console.log("Test Program:", testProgramData.name)

    // Send program to client
    console.log("\n=== SENDING PROGRAM TO CLIENT ===")
    const result = await programConversionService.sendProgramToClient(testClientId, testProgramData)

    console.log("✅ Program sent successfully")
    console.log("Result:", result)

    // Now check the created program document
    const clientUserId = result.clientUserId
    const programId = result.programId

    console.log("\n=== CHECKING CREATED PROGRAM DOCUMENT ===")
    console.log("Client User ID:", clientUserId)
    console.log("Program ID:", programId)

    const programDoc = await getDoc(doc(db, "users", clientUserId, "programs", programId))

    if (programDoc.exists()) {
      const programData = programDoc.data()

      console.log("✅ Program document exists")
      console.log("Program name:", programData.name)
      console.log("Program duration:", programData.duration)
      console.log("Routines count:", programData.routines?.length || 0)

      console.log("\n=== TIMESTAMP ANALYSIS ===")
      console.log("createdAt:", programData.createdAt)
      console.log("createdAt type:", typeof programData.createdAt)
      console.log("createdAt constructor:", programData.createdAt?.constructor?.name)
      console.log("createdAt has seconds:", !!programData.createdAt?.seconds)
      console.log("createdAt.toDate():", programData.createdAt?.toDate?.())

      console.log("\nstartedAt:", programData.startedAt)
      console.log("startedAt type:", typeof programData.startedAt)
      console.log("startedAt constructor:", programData.startedAt?.constructor?.name)
      console.log("startedAt has seconds:", !!programData.startedAt?.seconds)
      console.log("startedAt.toDate():", programData.startedAt?.toDate?.())

      console.log("\nupdatedAt:", programData.updatedAt)
      console.log("updatedAt type:", typeof programData.updatedAt)
      console.log("updatedAt constructor:", programData.updatedAt?.constructor?.name)
      console.log("updatedAt has seconds:", !!programData.updatedAt?.seconds)
      console.log("updatedAt.toDate():", programData.updatedAt?.toDate?.())

      // Mobile app compatibility check
      const isCreatedAtValid =
        programData.createdAt && typeof programData.createdAt === "object" && programData.createdAt.seconds
      const isStartedAtValid =
        programData.startedAt && typeof programData.startedAt === "object" && programData.startedAt.seconds
      const isUpdatedAtValid =
        programData.updatedAt && typeof programData.updatedAt === "object" && programData.updatedAt.seconds

      console.log("\n=== MOBILE APP COMPATIBILITY ===")
      console.log("createdAt valid for mobile app:", isCreatedAtValid)
      console.log("startedAt valid for mobile app:", isStartedAtValid)
      console.log("updatedAt valid for mobile app:", isUpdatedAtValid)

      if (isCreatedAtValid && isStartedAtValid && isUpdatedAtValid) {
        console.log("✅ ALL TIMESTAMPS ARE COMPATIBLE WITH MOBILE APP")

        console.log("\n=== FIRESTORE CONSOLE FORMAT ===")
        console.log(`createdAt: ${programData.createdAt.toDate().toLocaleString()} (timestamp)`)
        console.log(`startedAt: ${programData.startedAt.toDate().toLocaleString()} (timestamp)`)
        console.log(`updatedAt: ${programData.updatedAt.toDate().toLocaleString()} (timestamp)`)
      } else {
        console.log("❌ TIMESTAMPS ARE NOT COMPATIBLE WITH MOBILE APP")

        if (!isCreatedAtValid) {
          console.log("❌ createdAt issue:", programData.createdAt)
        }
        if (!isStartedAtValid) {
          console.log("❌ startedAt issue:", programData.startedAt)
        }
        if (!isUpdatedAtValid) {
          console.log("❌ updatedAt issue:", programData.updatedAt)
        }
      }
    } else {
      console.log("❌ Program document does not exist")
    }
  } catch (error) {
    console.error("❌ Error testing program conversion timestamps:", error)
  }
}

// Run the test
testProgramConversionTimestamps()
