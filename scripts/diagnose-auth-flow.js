// Diagnostic script to test the authentication flow
const fetch = require("node-fetch")

async function diagnoseAuthFlow() {
  console.log("🔍 Starting Auth Flow Diagnosis...\n")

  try {
    // Test the /api/auth/me endpoint
    console.log("1. Testing /api/auth/me endpoint...")

    const response = await fetch("http://localhost:3000/api/auth/me", {
      method: "GET",
      headers: {
        Cookie: "user_id=5tVdK6LXCifZgjxD7rml3nEOXmh1", // Use the user ID from your logs
      },
    })

    const data = await response.json()

    console.log("Response Status:", response.status)
    console.log("Response Data:", JSON.stringify(data, null, 2))

    if (data.role) {
      console.log(`✅ Role found: "${data.role}" (type: ${typeof data.role})`)

      if (data.role === "trainer") {
        console.log("✅ User should be redirected to /overview")
      } else {
        console.log("❌ User will be redirected to /mobile-app-success")
      }
    } else {
      console.log("❌ No role found in response")
    }

    // Test direct Firestore query
    console.log("\n2. Testing direct Firestore query...")

    const { db } = require("../lib/firebase/firebase")
    const { doc, getDoc } = require("firebase/firestore")

    const userRef = doc(db, "users", "5tVdK6LXCifZgjxD7rml3nEOXmh1")
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      const userData = userDoc.data()
      console.log("Direct Firestore Data:", {
        email: userData.email,
        role: userData.role,
        user_type: userData.user_type,
        roleType: typeof userData.role,
        hasRole: !!userData.role,
      })
    } else {
      console.log("❌ User document not found in Firestore")
    }
  } catch (error) {
    console.error("❌ Error during diagnosis:", error)
  }
}

diagnoseAuthFlow()
