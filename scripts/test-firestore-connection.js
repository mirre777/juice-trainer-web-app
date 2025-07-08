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

async function testFirestoreConnection() {
  try {
    console.log("🔄 Testing Firestore connection...")

    const db = admin.firestore()

    // Test basic connection
    const usersRef = db.collection("users")
    const snapshot = await usersRef.limit(5).get()

    console.log("✅ Firestore connection successful")
    console.log(`📊 Found ${snapshot.size} users`)

    // List all users with their emails
    console.log("\n👥 Users in database:")
    snapshot.forEach((doc) => {
      const data = doc.data()
      console.log(`- ID: ${doc.id}`)
      console.log(`  Email: ${data.email}`)
      console.log(`  Name: ${data.name || "N/A"}`)
      console.log(`  Role: ${data.role || "N/A"}`)
      console.log("---")
    })

    // Search for specific user
    const targetEmail = "mirresnelting@gmail.com"
    const targetEmailAlt = "mirresnelting+4@gmail.com"

    console.log(`\n🔍 Searching for user with email: ${targetEmail}`)
    const userQuery = await usersRef.where("email", "==", targetEmail).get()

    if (!userQuery.empty) {
      console.log("✅ User found!")
      userQuery.forEach((doc) => {
        console.log("User data:", doc.data())
      })
    } else {
      console.log("❌ User not found with primary email")

      console.log(`🔍 Searching for user with email: ${targetEmailAlt}`)
      const altQuery = await usersRef.where("email", "==", targetEmailAlt).get()

      if (!altQuery.empty) {
        console.log("✅ User found with alternative email!")
        altQuery.forEach((doc) => {
          console.log("User data:", doc.data())
        })
      } else {
        console.log("❌ User not found with alternative email either")
      }
    }
  } catch (error) {
    console.error("❌ Firestore connection failed:", error)
  }
}

testFirestoreConnection()
