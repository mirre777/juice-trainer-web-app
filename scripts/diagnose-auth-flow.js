const { db } = require("../lib/firebase/firebase")
const { doc, getDoc } = require("firebase/firestore")

async function diagnoseAuthFlow() {
  console.log("🔍 Starting Auth Flow Diagnosis...\n")

  try {
    // Test direct Firestore query for the user
    console.log("1. Testing direct Firestore query...")

    const userId = "5tVdK6LXCifZgjxD7rml3nEOXmh1" // From your logs
    console.log(`Looking up user: ${userId}`)

    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      const userData = userDoc.data()
      console.log("✅ User document found!")
      console.log("Raw Firestore Data:", {
        id: userDoc.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        user_type: userData.user_type,
        roleType: typeof userData.role,
        hasRole: !!userData.role,
        allKeys: Object.keys(userData),
      })

      if (userData.role === "trainer") {
        console.log("✅ User has trainer role - should redirect to /overview")
      } else {
        console.log(`❌ User role is "${userData.role}" - will redirect to mobile app`)
      }
    } else {
      console.log("❌ User document not found in Firestore")
    }

    // Test what the API endpoint would return
    console.log("\n2. Simulating API response format...")

    if (userDoc.exists()) {
      const userData = userDoc.data()

      // This is what the old API was returning (nested under 'user')
      const oldFormat = {
        user: {
          uid: userDoc.id,
          email: userData.email || "",
          name: userData.name || userData.displayName || "",
          role: userData.role || "user",
          user_type: userData.user_type,
        },
      }

      // This is what the new API should return (flat structure)
      const newFormat = {
        uid: userDoc.id,
        email: userData.email || "",
        name: userData.name || userData.displayName || "",
        role: userData.role || "user",
        user_type: userData.user_type,
      }

      console.log("Old API format (nested):", JSON.stringify(oldFormat, null, 2))
      console.log("New API format (flat):", JSON.stringify(newFormat, null, 2))

      console.log("\nRole extraction test:")
      console.log("oldFormat.role:", oldFormat.role)
      console.log("oldFormat.user.role:", oldFormat.user.role)
      console.log("newFormat.role:", newFormat.role)
    }
  } catch (error) {
    console.error("❌ Error during diagnosis:", error)
    console.error("Stack trace:", error.stack)
  }
}

// Run the diagnosis
diagnoseAuthFlow().catch(console.error)
