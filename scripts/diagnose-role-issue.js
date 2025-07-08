const admin = require("firebase-admin")

// Initialize Firebase Admin if not already done
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
    client_x509_cert_url: `https://www.googleapis.com/service-account/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`,
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

const db = admin.firestore()

async function diagnoseRoleIssue() {
  try {
    console.log("🔍 DIAGNOSING ROLE ISSUE")
    console.log("========================")

    const email = "mirresnelting@gmail.com" // Your email

    // 1. Check what's in Firestore by email query
    console.log("\n1. 📋 Querying Firestore by email...")
    const usersByEmail = await db.collection("users").where("email", "==", email).get()

    if (usersByEmail.empty) {
      console.log("❌ No users found with email:", email)
    } else {
      console.log(`✅ Found ${usersByEmail.size} user(s) with email:`, email)
      usersByEmail.forEach((doc) => {
        const data = doc.data()
        console.log("📄 Document ID:", doc.id)
        console.log("📄 Document data:", {
          email: data.email,
          role: data.role,
          user_type: data.user_type,
          name: data.name,
          hasFirebaseAuth: data.hasFirebaseAuth,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        })
      })
    }

    // 2. Check all users to see if there are duplicates or issues
    console.log("\n2. 📋 Checking all users in collection...")
    const allUsers = await db.collection("users").get()
    console.log(`📊 Total users in collection: ${allUsers.size}`)

    const emailMatches = []
    allUsers.forEach((doc) => {
      const data = doc.data()
      if (data.email === email) {
        emailMatches.push({
          id: doc.id,
          email: data.email,
          role: data.role,
          user_type: data.user_type,
          name: data.name,
        })
      }
    })

    console.log(`📊 Users with email ${email}:`, emailMatches)

    // 3. Check if there are any users with role "trainer"
    console.log("\n3. 📋 Checking all trainers in system...")
    const trainers = await db.collection("users").where("role", "==", "trainer").get()
    console.log(`📊 Total trainers found: ${trainers.size}`)

    trainers.forEach((doc) => {
      const data = doc.data()
      console.log("👨‍🏫 Trainer:", {
        id: doc.id,
        email: data.email,
        role: data.role,
        name: data.name,
      })
    })

    // 4. Try to find your specific user by different methods
    console.log("\n4. 🔍 Trying different search methods...")

    // Try case-insensitive search
    const allUsersData = []
    allUsers.forEach((doc) => {
      const data = doc.data()
      allUsersData.push({
        id: doc.id,
        email: data.email?.toLowerCase(),
        originalEmail: data.email,
        role: data.role,
        name: data.name,
      })
    })

    const caseInsensitiveMatch = allUsersData.filter((user) => user.email === email.toLowerCase())

    console.log("🔤 Case-insensitive email matches:", caseInsensitiveMatch)

    // 5. Check for any data type issues
    console.log("\n5. 🔍 Checking for data type issues...")
    allUsers.forEach((doc) => {
      const data = doc.data()
      if (data.email === email) {
        console.log("🔬 Data type analysis for matching user:")
        console.log("  - email type:", typeof data.email, "| value:", data.email)
        console.log("  - role type:", typeof data.role, "| value:", data.role)
        console.log("  - user_type type:", typeof data.user_type, "| value:", data.user_type)
        console.log("  - Raw document data:", JSON.stringify(data, null, 2))
      }
    })

    console.log("\n✅ Diagnosis complete!")
  } catch (error) {
    console.error("❌ Error during diagnosis:", error)
    console.error("Error details:", {
      code: error.code,
      message: error.message,
      stack: error.stack,
    })
  }
}

// Run the diagnosis
diagnoseRoleIssue()
  .then(() => {
    console.log("\n🏁 Script completed")
    process.exit(0)
  })
  .catch((error) => {
    console.error("💥 Script failed:", error)
    process.exit(1)
  })
