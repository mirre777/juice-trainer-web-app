import { initializeApp } from "firebase/app"
import { getFirestore, doc, getDoc, collection, getDocs, query, where } from "firebase/firestore"

// Firebase config - you'll need to add your actual config
const firebaseConfig = {
  // Add your Firebase config here
  projectId: "your-project-id", // Replace with actual project ID
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function diagnoseClientUserLinking() {
  console.log("🔍 === DIAGNOSING CLIENT-USER LINKING ===")

  const trainerId = "5tVdK6LXCifZgjxD7rml3nEOXmh1"
  const testCases = [
    {
      name: "Client with userId",
      clientId: "CGLJmpv59IngpsYpW7PZ",
      expectedUserId: "HN2QjNvnWKQ37nVXCSkhXdCwMEH2",
    },
    {
      name: "Client without userId",
      clientId: "tgFRWFvdcwp1iIYoegYr",
      expectedUserId: "HN2QjNvnWKQ37nVXCSkhXdCwMEH2",
    },
  ]

  for (const testCase of testCases) {
    console.log(`\n📋 Testing: ${testCase.name}`)
    console.log(`   Client ID: ${testCase.clientId}`)
    console.log(`   Expected User ID: ${testCase.expectedUserId}`)

    // Step 1: Check if client document exists
    console.log("\n🔍 Step 1: Checking client document...")
    const clientPath = `users/${trainerId}/clients/${testCase.clientId}`
    console.log(`   Path: /${clientPath}`)

    try {
      const clientRef = doc(db, "users", trainerId, "clients", testCase.clientId)
      const clientDoc = await getDoc(clientRef)

      if (clientDoc.exists()) {
        const clientData = clientDoc.data()
        console.log("   ✅ Client document exists")
        console.log("   📄 Client data:", {
          name: clientData.name,
          email: clientData.email,
          status: clientData.status,
          userId: clientData.userId || "MISSING",
          isTemporary: clientData.isTemporary,
        })

        // Step 2: Check if user document exists (if userId is present)
        if (clientData.userId) {
          console.log("\n🔍 Step 2: Checking user document...")
          const userPath = `users/${clientData.userId}`
          console.log(`   Path: /${userPath}`)

          try {
            const userRef = doc(db, "users", clientData.userId)
            const userDoc = await getDoc(userRef)

            if (userDoc.exists()) {
              const userData = userDoc.data()
              console.log("   ✅ User document exists")
              console.log("   👤 User data:", {
                name: userData.name,
                email: userData.email,
                status: userData.status,
                hasTrainers: !!(userData.trainers && userData.trainers.length > 0),
                trainers: userData.trainers || [],
              })

              // Step 3: Check if trainer is in user's trainers array
              if (userData.trainers && userData.trainers.includes(trainerId)) {
                console.log("   ✅ Trainer is in user's trainers array")
              } else {
                console.log("   ❌ Trainer is NOT in user's trainers array")
                console.log("   🔧 This could cause issues with program sending")
              }
            } else {
              console.log("   ❌ User document does NOT exist")
              console.log("   🚨 This is the problem! Client has userId but user document is missing")
            }
          } catch (userError) {
            console.log("   ❌ Error fetching user document:", userError.message)
          }
        } else {
          console.log("\n⚠️  Step 2: Skipped - Client has no userId field")

          // Try to find user by email
          console.log("\n🔍 Step 2b: Searching for user by email...")
          if (clientData.email) {
            try {
              const usersRef = collection(db, "users")
              const emailQuery = query(usersRef, where("email", "==", clientData.email))
              const emailSnapshot = await getDocs(emailQuery)

              if (!emailSnapshot.empty) {
                const foundUser = emailSnapshot.docs[0]
                console.log("   ✅ Found user by email:", foundUser.id)
                console.log("   📧 User email matches client email")
                console.log("   🔧 This client should be linked to user:", foundUser.id)
              } else {
                console.log("   ❌ No user found with email:", clientData.email)
              }
            } catch (emailError) {
              console.log("   ❌ Error searching by email:", emailError.message)
            }
          }
        }
      } else {
        console.log("   ❌ Client document does NOT exist")
      }
    } catch (clientError) {
      console.log("   ❌ Error fetching client document:", clientError.message)
    }

    console.log("\n" + "=".repeat(60))
  }

  // Step 4: Check program conversion service logic
  console.log("\n🔍 Step 4: Testing program conversion service logic...")

  for (const testCase of testCases) {
    console.log(`\n📋 Testing program conversion for: ${testCase.name}`)

    try {
      // Simulate the getClientUserId function
      const clientRef = doc(db, "users", trainerId, "clients", testCase.clientId)
      const clientDoc = await getDoc(clientRef)

      if (clientDoc.exists()) {
        const clientData = clientDoc.data()
        const userId = clientData.userId || null

        console.log(`   Client userId from document: ${userId || "NULL"}`)

        if (userId) {
          // Check if this userId actually exists
          const userRef = doc(db, "users", userId)
          const userDoc = await getDoc(userRef)

          if (userDoc.exists()) {
            console.log("   ✅ Program conversion should work - user document exists")
          } else {
            console.log("   ❌ Program conversion will FAIL - user document missing")
            console.log("   🔧 Need to either:")
            console.log("      1. Create user document at /users/" + userId)
            console.log("      2. Update client userId to correct value")
            console.log("      3. Remove userId field and re-link client")
          }
        } else {
          console.log("   ❌ Program conversion will FAIL - no userId in client document")
        }
      }
    } catch (error) {
      console.log("   ❌ Error in program conversion test:", error.message)
    }
  }

  console.log("\n🏁 === DIAGNOSIS COMPLETE ===")
}

// Run the diagnosis
diagnoseClientUserLinking().catch(console.error)
