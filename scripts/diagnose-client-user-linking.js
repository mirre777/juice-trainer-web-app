import { initializeApp } from "firebase/app"
import { getFirestore, doc, getDoc, collection, getDocs, query, where } from "firebase/firestore"

// Firebase config using environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

console.log("🔧 Firebase Config Check:")
console.log("  Project ID:", firebaseConfig.projectId || "MISSING")
console.log("  Auth Domain:", firebaseConfig.authDomain || "MISSING")
console.log("  API Key:", firebaseConfig.apiKey ? "✅ Present" : "❌ Missing")

let app, db

try {
  app = initializeApp(firebaseConfig)
  db = getFirestore(app)
  console.log("✅ Firebase initialized successfully")
} catch (error) {
  console.error("❌ Firebase initialization failed:", error.message)
  process.exit(1)
}

async function diagnoseClientUserLinking() {
  console.log("\n🔍 === DIAGNOSING CLIENT-USER LINKING ===")
  console.log("Timestamp:", new Date().toISOString())

  const trainerId = "5tVdK6LXCifZgjxD7rml3nEOXmh1"
  const testCases = [
    {
      name: "Client with userId (CGLJmpv59IngpsYpW7PZ)",
      clientId: "CGLJmpv59IngpsYpW7PZ",
      expectedUserId: "HN2QjNvnWKQ37nVXCSkhXdCwMEH2",
    },
    {
      name: "Client without userId (tgFRWFvdcwp1iIYoegYr)",
      clientId: "tgFRWFvdcwp1iIYoegYr",
      expectedUserId: "HN2QjNvnWKQ37nVXCSkhXdCwMEH2",
    },
  ]

  console.log(`\n📋 Testing ${testCases.length} client cases for trainer: ${trainerId}`)

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i]
    console.log(`\n${"=".repeat(80)}`)
    console.log(`📋 TEST CASE ${i + 1}: ${testCase.name}`)
    console.log(`   Client ID: ${testCase.clientId}`)
    console.log(`   Expected User ID: ${testCase.expectedUserId}`)
    console.log(`${"=".repeat(80)}`)

    // Step 1: Check if client document exists
    console.log("\n🔍 STEP 1: Checking client document...")
    const clientPath = `users/${trainerId}/clients/${testCase.clientId}`
    console.log(`   Full Path: /${clientPath}`)

    try {
      console.log("   📡 Fetching client document...")
      const clientRef = doc(db, "users", trainerId, "clients", testCase.clientId)
      const clientDoc = await getDoc(clientRef)

      if (clientDoc.exists()) {
        const clientData = clientDoc.data()
        console.log("   ✅ Client document EXISTS")
        console.log("   📄 Raw client data keys:", Object.keys(clientData))
        console.log("   📄 Client document data:")
        console.log("      - name:", clientData.name || "MISSING")
        console.log("      - email:", clientData.email || "MISSING")
        console.log("      - status:", clientData.status || "MISSING")
        console.log("      - userId:", clientData.userId || "❌ MISSING")
        console.log("      - isTemporary:", clientData.isTemporary)
        console.log("      - createdAt:", clientData.createdAt || "MISSING")
        console.log("      - updatedAt:", clientData.updatedAt || "MISSING")

        // Step 2: Check if user document exists (if userId is present)
        if (clientData.userId) {
          console.log("\n🔍 STEP 2: Checking user document...")
          const userPath = `users/${clientData.userId}`
          console.log(`   Full Path: /${userPath}`)

          try {
            console.log("   📡 Fetching user document...")
            const userRef = doc(db, "users", clientData.userId)
            const userDoc = await getDoc(userRef)

            if (userDoc.exists()) {
              const userData = userDoc.data()
              console.log("   ✅ User document EXISTS")
              console.log("   👤 Raw user data keys:", Object.keys(userData))
              console.log("   👤 User document data:")
              console.log("      - name:", userData.name || "MISSING")
              console.log("      - email:", userData.email || "MISSING")
              console.log("      - status:", userData.status || "MISSING")
              console.log("      - trainers:", userData.trainers || "MISSING")
              console.log("      - trainers length:", (userData.trainers || []).length)
              console.log("      - createdAt:", userData.createdAt || "MISSING")
              console.log("      - linkedAt:", userData.linkedAt || "MISSING")

              // Step 3: Check if trainer is in user's trainers array
              console.log("\n🔍 STEP 3: Checking trainer relationship...")
              if (userData.trainers && Array.isArray(userData.trainers)) {
                console.log("   📋 User's trainers array:", userData.trainers)
                if (userData.trainers.includes(trainerId)) {
                  console.log("   ✅ Trainer IS in user's trainers array")
                  console.log("   🎯 PROGRAM SENDING SHOULD WORK")
                } else {
                  console.log("   ❌ Trainer is NOT in user's trainers array")
                  console.log("   🚨 This will cause program sending to FAIL")
                  console.log("   🔧 Need to add trainer to user's trainers array")
                }
              } else {
                console.log("   ❌ User has no trainers array or it's not an array")
                console.log("   🚨 This will cause program sending to FAIL")
              }

              // Email verification
              console.log("\n🔍 STEP 4: Email verification...")
              if (clientData.email && userData.email) {
                if (clientData.email === userData.email) {
                  console.log("   ✅ Client and user emails MATCH")
                } else {
                  console.log("   ⚠️  Client and user emails DO NOT MATCH")
                  console.log("      Client email:", clientData.email)
                  console.log("      User email:", userData.email)
                }
              } else {
                console.log("   ⚠️  Missing email data")
                console.log("      Client email:", clientData.email || "MISSING")
                console.log("      User email:", userData.email || "MISSING")
              }
            } else {
              console.log("   ❌ User document does NOT exist")
              console.log("   🚨 CRITICAL ISSUE: Client has userId but user document is missing")
              console.log("   🔧 Possible solutions:")
              console.log("      1. Create user document at this path")
              console.log("      2. Update client userId to correct value")
              console.log("      3. Remove userId field and re-link client")
            }
          } catch (userError) {
            console.log("   ❌ ERROR fetching user document:", userError.message)
            console.log("   📊 Error details:", userError)
          }
        } else {
          console.log("\n⚠️  STEP 2: SKIPPED - Client has no userId field")

          // Try to find user by email
          console.log("\n🔍 STEP 2b: Searching for user by email...")
          if (clientData.email) {
            try {
              console.log("   📡 Searching users collection by email...")
              const usersRef = collection(db, "users")
              const emailQuery = query(usersRef, where("email", "==", clientData.email))
              const emailSnapshot = await getDocs(emailQuery)

              console.log("   📊 Search results:", emailSnapshot.size, "documents found")

              if (!emailSnapshot.empty) {
                emailSnapshot.forEach((doc) => {
                  const userData = doc.data()
                  console.log("   ✅ Found user by email:")
                  console.log("      User ID:", doc.id)
                  console.log("      Name:", userData.name)
                  console.log("      Status:", userData.status)
                  console.log("      Trainers:", userData.trainers || [])
                  console.log("   🔧 This client SHOULD be linked to user:", doc.id)
                })
              } else {
                console.log("   ❌ No user found with email:", clientData.email)
                console.log("   🔧 User might need to be created or email might be different")
              }
            } catch (emailError) {
              console.log("   ❌ ERROR searching by email:", emailError.message)
            }
          } else {
            console.log("   ❌ Cannot search by email - client has no email field")
          }
        }
      } else {
        console.log("   ❌ Client document does NOT exist")
        console.log("   🚨 CRITICAL ISSUE: Client document missing entirely")
        console.log("   🔧 Check if client ID is correct:", testCase.clientId)
      }
    } catch (clientError) {
      console.log("   ❌ ERROR fetching client document:", clientError.message)
      console.log("   📊 Error details:", clientError)
    }
  }

  // Summary
  console.log("\n" + "=".repeat(80))
  console.log("🏁 === DIAGNOSIS SUMMARY ===")
  console.log("=".repeat(80))

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i]
    console.log(`\n📋 ${testCase.name}:`)

    try {
      const clientRef = doc(db, "users", trainerId, "clients", testCase.clientId)
      const clientDoc = await getDoc(clientRef)

      if (clientDoc.exists()) {
        const clientData = clientDoc.data()
        const hasUserId = !!clientData.userId

        console.log(`   Client exists: ✅`)
        console.log(`   Has userId: ${hasUserId ? "✅" : "❌"}`)

        if (hasUserId) {
          const userRef = doc(db, "users", clientData.userId)
          const userDoc = await getDoc(userRef)
          const userExists = userDoc.exists()

          console.log(`   User exists: ${userExists ? "✅" : "❌"}`)

          if (userExists) {
            const userData = userDoc.data()
            const hasTrainer = userData.trainers && userData.trainers.includes(trainerId)
            console.log(`   Trainer linked: ${hasTrainer ? "✅" : "❌"}`)
            console.log(`   Can send programs: ${hasTrainer ? "✅ YES" : "❌ NO"}`)
          } else {
            console.log(`   Can send programs: ❌ NO (user missing)`)
          }
        } else {
          console.log(`   Can send programs: ❌ NO (no userId)`)
        }
      } else {
        console.log(`   Client exists: ❌`)
        console.log(`   Can send programs: ❌ NO (client missing)`)
      }
    } catch (error) {
      console.log(`   Error: ${error.message}`)
    }
  }

  console.log("\n🔧 === RECOMMENDED ACTIONS ===")
  console.log("1. Check the API endpoint: GET /api/debug/client-user-link")
  console.log("2. Use the client linking service to fix broken links")
  console.log("3. Verify Firebase permissions and indexes")
  console.log("\n✅ Diagnosis complete!")
}

// Run the diagnosis with error handling
console.log("🚀 Starting client-user linking diagnosis...")

diagnoseClientUserLinking()
  .then(() => {
    console.log("\n🎉 Diagnosis completed successfully!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n💥 Diagnosis failed with error:")
    console.error("Error message:", error.message)
    console.error("Stack trace:", error.stack)
    process.exit(1)
  })
