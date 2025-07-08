const { initializeApp } = require("firebase/app")
const { getFirestore, doc, setDoc, getDoc, Timestamp, collection } = require("firebase/firestore")
const { v4: uuidv4 } = require("uuid")

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

async function verifyTimestampFormat() {
  try {
    console.log("=== VERIFYING TIMESTAMP FORMAT FOR MOBILE APP COMPATIBILITY ===")

    // Test user ID (the client user ID from your example)
    const testUserId = "HN2QjNvnWKQ37nVXCSkhXdCwI8l2"
    const programId = uuidv4()

    console.log(`Test User ID: ${testUserId}`)
    console.log(`Test Program ID: ${programId}`)

    // Create timestamps using Timestamp.now()
    const now = Timestamp.now()
    const startedAt = Timestamp.now()
    const updatedAt = Timestamp.now()

    console.log("\n=== TIMESTAMP OBJECTS BEFORE SAVING ===")
    console.log("now:", now)
    console.log("now type:", typeof now)
    console.log("now constructor:", now.constructor.name)
    console.log("now.seconds:", now.seconds)
    console.log("now.nanoseconds:", now.nanoseconds)
    console.log("now.toDate():", now.toDate())

    // Create a test program document matching your mobile app structure
    const testProgram = {
      id: programId,
      name: "Test Timestamp Program",
      notes: "",
      createdAt: now,
      startedAt: startedAt,
      updatedAt: updatedAt,
      duration: 4,
      program_URL: "",
      routines: [
        {
          routineId: uuidv4(),
          week: 1,
          order: 1,
        },
        {
          routineId: uuidv4(),
          week: 1,
          order: 2,
        },
      ],
    }

    console.log("\n=== PROGRAM OBJECT BEFORE SAVING ===")
    console.log("Program ID:", testProgram.id)
    console.log("Program Name:", testProgram.name)
    console.log("createdAt:", testProgram.createdAt)
    console.log("startedAt:", testProgram.startedAt)
    console.log("updatedAt:", testProgram.updatedAt)
    console.log("createdAt type:", typeof testProgram.createdAt)
    console.log("startedAt type:", typeof testProgram.startedAt)
    console.log("updatedAt type:", typeof testProgram.updatedAt)

    // Save to Firestore
    const programRef = doc(collection(db, "users", testUserId, "programs"), programId)

    console.log("\n=== SAVING TO FIRESTORE ===")
    console.log("Document path:", `users/${testUserId}/programs/${programId}`)

    await setDoc(programRef, testProgram)
    console.log("✅ Program saved successfully")

    // Read it back to verify the format
    console.log("\n=== READING BACK FROM FIRESTORE ===")
    const savedDoc = await getDoc(programRef)

    if (savedDoc.exists()) {
      const savedData = savedDoc.data()

      console.log("✅ Document exists")
      console.log("Document ID:", savedDoc.id)
      console.log("Document data keys:", Object.keys(savedData))

      console.log("\n=== TIMESTAMP FIELDS IN SAVED DOCUMENT ===")
      console.log("createdAt:", savedData.createdAt)
      console.log("createdAt type:", typeof savedData.createdAt)
      console.log("createdAt constructor:", savedData.createdAt?.constructor?.name)
      console.log("createdAt.seconds:", savedData.createdAt?.seconds)
      console.log("createdAt.nanoseconds:", savedData.createdAt?.nanoseconds)
      console.log("createdAt.toDate():", savedData.createdAt?.toDate?.())

      console.log("\nstartedAt:", savedData.startedAt)
      console.log("startedAt type:", typeof savedData.startedAt)
      console.log("startedAt constructor:", savedData.startedAt?.constructor?.name)
      console.log("startedAt.toDate():", savedData.startedAt?.toDate?.())

      console.log("\nupdatedAt:", savedData.updatedAt)
      console.log("updatedAt type:", typeof savedData.updatedAt)
      console.log("updatedAt constructor:", savedData.updatedAt?.constructor?.name)
      console.log("updatedAt.toDate():", savedData.updatedAt?.toDate?.())

      // Check if they match the expected mobile app format
      console.log("\n=== MOBILE APP COMPATIBILITY CHECK ===")
      const isCreatedAtTimestamp =
        savedData.createdAt && typeof savedData.createdAt === "object" && savedData.createdAt.seconds
      const isStartedAtTimestamp =
        savedData.startedAt && typeof savedData.startedAt === "object" && savedData.startedAt.seconds
      const isUpdatedAtTimestamp =
        savedData.updatedAt && typeof savedData.updatedAt === "object" && savedData.updatedAt.seconds

      console.log("createdAt is proper timestamp:", isCreatedAtTimestamp)
      console.log("startedAt is proper timestamp:", isStartedAtTimestamp)
      console.log("updatedAt is proper timestamp:", isUpdatedAtTimestamp)

      if (isCreatedAtTimestamp && isStartedAtTimestamp && isUpdatedAtTimestamp) {
        console.log("✅ ALL TIMESTAMPS ARE IN CORRECT FORMAT FOR MOBILE APP")
      } else {
        console.log("❌ TIMESTAMPS ARE NOT IN CORRECT FORMAT")
      }

      // Show the exact format as it appears in Firestore console
      console.log("\n=== FIRESTORE CONSOLE FORMAT ===")
      console.log(`createdAt: ${savedData.createdAt.toDate().toLocaleString()} (timestamp)`)
      console.log(`startedAt: ${savedData.startedAt.toDate().toLocaleString()} (timestamp)`)
      console.log(`updatedAt: ${savedData.updatedAt.toDate().toLocaleString()} (timestamp)`)
    } else {
      console.log("❌ Document does not exist")
    }
  } catch (error) {
    console.error("❌ Error:", error)
  }
}

// Run the verification
verifyTimestampFormat()
