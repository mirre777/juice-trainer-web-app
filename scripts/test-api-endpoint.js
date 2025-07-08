import fetch from "node-fetch"

async function testSendToClientAPI() {
  console.log("🧪 Testing /api/programs/send-to-client endpoint...\n")

  // Test data based on your Firebase documents
  const testData = {
    clientId: "CGLJmpv59IngpsYpW7PZ", // Your client ID
    programData: {
      name: "Test Program via API",
      description: "Testing the API endpoint directly",
      duration_weeks: 4,
      routines: [
        {
          name: "Upper Body",
          exercises: [
            {
              name: "Bench Press",
              sets: 3,
              reps: "8-10",
              weight: "80kg",
              rest: "2min",
              notes: "Focus on form",
            },
            {
              name: "Pull-ups",
              sets: 3,
              reps: "6-8",
              weight: "Bodyweight",
              rest: "90sec",
            },
          ],
        },
        {
          name: "Lower Body",
          exercises: [
            {
              name: "Squats",
              sets: 4,
              reps: "10-12",
              weight: "100kg",
              rest: "2min",
            },
          ],
        },
      ],
    },
    customMessage: "Test message from API script",
  }

  try {
    console.log("📤 Making POST request to /api/programs/send-to-client")
    console.log("📋 Request data:", JSON.stringify(testData, null, 2))

    const response = await fetch("http://localhost:3000/api/programs/send-to-client", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add any auth headers if needed
        Cookie: "auth_token=your_token_here", // You'll need to replace this
      },
      body: JSON.stringify(testData),
    })

    console.log("\n📊 Response Status:", response.status)
    console.log("📊 Response Headers:", Object.fromEntries(response.headers.entries()))

    if (response.ok) {
      const result = await response.json()
      console.log("✅ SUCCESS! Response:", JSON.stringify(result, null, 2))
    } else {
      const errorText = await response.text()
      console.log("❌ ERROR Response:", errorText)

      if (response.status === 404) {
        console.log("\n🔍 404 Error Analysis:")
        console.log("- Check if the API route file exists at: app/api/programs/send-to-client/route.ts")
        console.log("- Check if Next.js server is running")
        console.log("- Check if the route is properly exported")
      } else if (response.status === 401) {
        console.log("\n🔍 401 Error Analysis:")
        console.log("- Authentication failed")
        console.log("- Check auth_token cookie")
        console.log("- Check getCurrentUser() function")
      } else if (response.status === 500) {
        console.log("\n🔍 500 Error Analysis:")
        console.log("- Server error in the API route")
        console.log("- Check server logs for detailed error")
      }
    }
  } catch (error) {
    console.error("❌ Network/Connection Error:", error.message)
    console.log("\n🔍 Possible causes:")
    console.log("- Next.js server not running (run: npm run dev)")
    console.log("- Wrong port (check if app runs on different port)")
    console.log("- Network connectivity issues")
  }
}

// Also test if the route file exists and is properly structured
async function checkRouteFile() {
  console.log("\n🔍 Checking API route file structure...")

  try {
    // This would be better done with fs, but let's try a simple approach
    const routeCheck = await fetch("http://localhost:3000/api/programs/send-to-client", {
      method: "OPTIONS",
    })

    console.log("📊 OPTIONS request status:", routeCheck.status)

    if (routeCheck.status === 405) {
      console.log("✅ Route exists but OPTIONS not allowed (normal)")
    } else if (routeCheck.status === 404) {
      console.log("❌ Route file does not exist or not properly exported")
    }
  } catch (error) {
    console.log("❌ Could not check route:", error.message)
  }
}

// Run the tests
async function runTests() {
  await checkRouteFile()
  await testSendToClientAPI()
}

runTests().catch(console.error)
