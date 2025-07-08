const admin = require("firebase-admin")

async function testFirestoreConnection() {
  try {
    console.log("🔍 Testing Firestore connection...")

    // Initialize Firebase Admin (if not already initialized)
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
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      })
    }

    const db = admin.firestore()

    // Test 1: List first 5 users
    console.log("📋 Listing first 5 users...")
    const usersSnapshot = await db.collection("users").limit(5).get()

    if (usersSnapshot.empty) {
      console.log("❌ No users found in database")
    } else {
      console.log(`✅ Found ${usersSnapshot.size} users:`)
      usersSnapshot.forEach((doc) => {
        const data = doc.data()
        console.log(`  - ${doc.id}: ${data.email} (role: ${data.role || "none"})`)
      })
    }

    // Test 2: Search for specific user
    const testEmails = ["mirresnelting@gmail.com", "mirresnelting+4@gmail.com"]

    for (const email of testEmails) {
      console.log(`🔍 Searching for user: ${email}`)
      const userQuery = await db.collection("users").where("email", "==", email).get()

      if (userQuery.empty) {
        console.log(`❌ User not found: ${email}`)
      } else {
        console.log(`✅ User found: ${email}`)
        userQuery.forEach((doc) => {
          const data = doc.data()
          console.log(`  - ID: ${doc.id}`)
          console.log(`  - Email: ${data.email}`)
          console.log(`  - Role: ${data.role || "none"}`)
          console.log(`  - Name: ${data.name || "none"}`)
        })
      }
    }

    console.log("✅ Firestore connection test completed successfully")
  } catch (error) {
    console.error("❌ Firestore connection test failed:", error)
    console.error("Error details:", {
      code: error.code,
      message: error.message,
    })
  }
}

testFirestoreConnection()
