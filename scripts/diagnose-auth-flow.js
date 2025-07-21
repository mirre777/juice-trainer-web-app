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
    databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`,
  })
}

const db = admin.firestore()

async function diagnoseAuthFlow() {
  console.log("🔍 Starting Auth Flow Diagnosis...\n")

  try {
    // Test 1: Check Firebase connection
    console.log("1️⃣ Testing Firebase connection...")
    const testDoc = await db.collection("users").limit(1).get()
    console.log(`✅ Firebase connected. Found ${testDoc.size} user(s)\n`)

    // Test 2: Look for your specific user
    console.log("2️⃣ Looking for trainer users...")
    const trainersQuery = await db.collection("users").where("role", "==", "trainer").limit(5).get()

    console.log(`Found ${trainersQuery.size} trainer(s):`)
    trainersQuery.forEach((doc) => {
      const data = doc.data()
      console.log(`  - ${data.email} (ID: ${doc.id})`)
      console.log(`    Role: ${data.role}`)
      console.log(`    Name: ${data.name || "Not set"}`)
      console.log(`    Status: ${data.status || "Not set"}\n`)
    })

    // Test 3: Test API response format
    console.log("3️⃣ Testing API response formats...")
    if (trainersQuery.size > 0) {
      const firstTrainer = trainersQuery.docs[0]
      const userData = firstTrainer.data()

      console.log("Raw Firestore data:")
      console.log(JSON.stringify(userData, null, 2))

      console.log("\nOld API format (nested under user):")
      console.log(JSON.stringify({ user: userData }, null, 2))

      console.log("\nNew API format (flat):")
      console.log(JSON.stringify(userData, null, 2))

      // Test role extraction
      console.log("\n4️⃣ Testing role extraction:")
      console.log(`Direct role: ${userData.role}`)
      console.log(`Role type: ${typeof userData.role}`)
      console.log(`Role exists: ${!!userData.role}`)
      console.log(`Is trainer: ${userData.role === "trainer"}`)
    }
  } catch (error) {
    console.error("❌ Error during diagnosis:", error)
    console.error("Error details:", {
      code: error.code,
      message: error.message,
      stack: error.stack,
    })
  }
}

diagnoseAuthFlow()
