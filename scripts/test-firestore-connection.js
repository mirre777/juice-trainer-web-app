const admin = require("firebase-admin")

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
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

    console.log("✅ Firebase Admin initialized successfully")
  } catch (error) {
    console.error("❌ Firebase Admin initialization failed:", error.message)
    process.exit(1)
  }
}

async function testFirestoreConnection() {
  try {
    console.log("🔄 Testing Firestore connection...")

    const db = admin.firestore()

    // Test 1: Simple read operation
    console.log("📋 Testing basic Firestore read...")
    const usersRef = db.collection("users")
    const snapshot = await usersRef.limit(1).get()

    if (snapshot.empty) {
      console.log("⚠️  Users collection is empty")
    } else {
      console.log("✅ Firestore read successful")
      console.log(`📊 Found ${snapshot.size} document(s) in users collection`)
    }

    // Test 2: Query specific user
    console.log("🔍 Testing user query...")
    const userQuery = await usersRef.where("email", "==", "mirresnelting+4@gmail.com").get()

    if (userQuery.empty) {
      console.log("❌ User not found with email: mirresnelting+4@gmail.com")

      // List all users to see what's available
      console.log("📋 Listing all users in collection:")
      const allUsers = await usersRef.get()
      allUsers.forEach((doc) => {
        const data = doc.data()
        console.log(`  - ID: ${doc.id}, Email: ${data.email}, Role: ${data.role}`)
      })
    } else {
      console.log("✅ User found!")
      userQuery.forEach((doc) => {
        const data = doc.data()
        console.log("👤 User data:", {
          id: doc.id,
          email: data.email,
          role: data.role,
          user_type: data.user_type,
          name: data.name,
          hasFirebaseAuth: data.hasFirebaseAuth,
        })
      })
    }

    // Test 3: Check Firestore rules
    console.log("🔒 Testing Firestore security rules...")
    try {
      // This will fail if rules are too restrictive
      const testDoc = await db.collection("users").doc("test-doc").get()
      console.log("✅ Firestore rules allow read access")
    } catch (rulesError) {
      console.log("⚠️  Firestore rules may be restrictive:", rulesError.message)
    }

    console.log("🎉 Firestore connection test completed")
  } catch (error) {
    console.error("❌ Firestore connection test failed:", error)
    console.error("Error details:", {
      code: error.code,
      message: error.message,
      stack: error.stack,
    })
  }
}

// Run the test
testFirestoreConnection()
  .then(() => {
    console.log("✅ Test completed")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Test failed:", error)
    process.exit(1)
  })
