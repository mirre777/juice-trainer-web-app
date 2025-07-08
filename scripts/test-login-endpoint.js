// Script to test the login API endpoint
const fetch = require("node-fetch")

console.log("🔑 Testing login API endpoint...")

// Configuration
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
const LOGIN_ENDPOINT = `${APP_URL}/api/auth/login`

// Test credentials - these should be replaced with actual test credentials
const TEST_EMAIL = process.env.TEST_EMAIL || "test@example.com"
const TEST_PASSWORD = process.env.TEST_PASSWORD || "password123"

// Test cases
const testCases = [
  {
    name: "Basic login",
    payload: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    },
  },
  {
    name: "Missing email",
    payload: {
      password: TEST_PASSWORD,
    },
  },
  {
    name: "Missing password",
    payload: {
      email: TEST_EMAIL,
    },
  },
  {
    name: "With invitation code",
    payload: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      invitationCode: "TEST123",
    },
  },
  {
    name: "Invalid JSON",
    rawPayload: '{"email": "' + TEST_EMAIL + '", "password": "' + TEST_PASSWORD + '"', // Missing closing brace
  },
]

// Function to test the login endpoint
async function testLoginEndpoint(testCase) {
  console.log(`\n🔄 Running test case: ${testCase.name}`)

  try {
    const payload = testCase.rawPayload || JSON.stringify(testCase.payload)
    console.log(
      "📦 Request payload:",
      testCase.rawPayload
        ? "Invalid JSON"
        : JSON.stringify({
            ...testCase.payload,
            password: testCase.payload?.password ? "********" : undefined,
          }),
    )

    const response = await fetch(LOGIN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: payload,
    })

    const status = response.status
    console.log(`🔢 Response status: ${status}`)

    let responseData
    try {
      responseData = await response.json()
      console.log("📄 Response data:", JSON.stringify(responseData, null, 2))
    } catch (error) {
      console.error("❌ Failed to parse response as JSON:", error.message)
      const text = await response.text()
      console.log("📄 Response text:", text.substring(0, 500) + (text.length > 500 ? "..." : ""))
    }

    // Check for 500 errors specifically
    if (status === 500) {
      console.error("❌ 500 Internal Server Error detected!")
      console.error("This indicates a server-side issue that needs to be fixed.")
    }

    return {
      success: status < 500, // Consider it a test success if we don't get a 500 error
      status,
      data: responseData,
    }
  } catch (error) {
    console.error("❌ Request failed:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

// Run all test cases
async function runTests() {
  console.log(`🌐 Testing against: ${LOGIN_ENDPOINT}`)

  const results = []

  for (const testCase of testCases) {
    const result = await testLoginEndpoint(testCase)
    results.push({
      name: testCase.name,
      ...result,
    })
  }

  // Print summary
  console.log("\n📊 Test Summary:")
  results.forEach((result) => {
    console.log(`${result.success ? "✅" : "❌"} ${result.name}: ${result.status || result.error}`)
  })

  // Check for any 500 errors
  const has500Errors = results.some((result) => result.status === 500)
  if (has500Errors) {
    console.error("\n❌ Some tests resulted in 500 Internal Server Errors!")
    console.error("This indicates server-side issues that need to be fixed.")
    process.exit(1)
  } else {
    console.log("\n✅ No 500 Internal Server Errors detected.")
    process.exit(0)
  }
}

runTests().catch((error) => {
  console.error("Unhandled error during tests:", error)
  process.exit(1)
})
