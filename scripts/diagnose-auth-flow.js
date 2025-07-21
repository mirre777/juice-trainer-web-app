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

      // This is what the current API is returning (nested under 'user')
      const currentFormat = {
        user: {
          id: userDoc.id,
          email: userData.email || "",
          name: userData.name || userData.displayName || "",
          role: userData.role || "user",
          user_type: userData.user_type,
        },
      }

      // This is what we want the API to return (flat structure)
      const fixedFormat = {
        uid: userDoc.id,
        email: userData.email || "",
        name: userData.name || userData.displayName || "",
        role: userData.role || "user",
        user_type: userData.user_type,
      }

      console.log("Current API format (nested):", JSON.stringify(currentFormat, null, 2))
      console.log("Fixed API format (flat):", JSON.stringify(fixedFormat, null, 2))

      console.log("\n3. Role extraction test:")
      console.log("currentFormat.role:", currentFormat.role, "(should be undefined)")
      console.log("currentFormat.user.role:", currentFormat.user.role, "(should be 'trainer')")
      console.log("fixedFormat.role:", fixedFormat.role, "(should be 'trainer')")

      console.log("\n4. Auth form logic test:")
      const userRole = currentFormat.user?.role || currentFormat.role
      console.log(`Extracted role: "${userRole}"`)
      if (userRole === "trainer") {
        console.log("✅ Would redirect to /overview")
      } else {
        console.log("❌ Would redirect to /mobile-app-success")
      }
    }
  } catch (error) {
    console.error("❌ Error during diagnosis:", error)
    console.error("Stack trace:", error.stack)
  }
}

// Run the diagnosis
diagnoseAuthFlow().catch(console.error)
