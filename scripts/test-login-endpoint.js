#!/usr/bin/env node

/**
 * Login Endpoint Test
 * This script tests the login API endpoint directly
 */

const fetch = require("node-fetch")

console.log("🔑 Testing login API endpoint...")

// Configuration
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
const LOGIN_ENDPOINT = `${APP_URL}/api/auth/login`

// Test credentials - these should be replaced with actual test credentials
const TEST_EMAIL = process.env.TEST_EMAIL || "test@example.com"
const TEST_PASSWORD = process.env.TEST_PASSWORD || "password123"

console.log(`🌐 Testing against: ${LOGIN_ENDPOINT}`)
console.log(`📧 Test email: ${TEST_EMAIL}`)
console.log("")

// Test cases
const testCases = [
  {
    name: "Missing email and password",
    payload: {},
    expectedStatus: 400,
    description: "Should return 400 for missing credentials",
  },
  {
    name: "Missing password",
    payload: {
      email: TEST_EMAIL,
    },
    expectedStatus: 400,
    description: "Should return 400 for missing password",
  },
  {
    name: "Missing email",
    payload: {
      password: TEST_PASSWORD,
    },
    expectedStatus: 400,
    description: "Should return 400 for missing email",
  },
  {
    name: "Invalid email format",
    payload: {
      email: "invalid-email-format",
      password: TEST_PASSWORD,
    },
    expectedStatus: 400,
    description: "Should return 400 for invalid email format",
  },
  {
    name: "Basic login attempt",
    payload: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    },
    expectedStatus: [401, 404], // Either user not found or wrong password
    description: "Should return 401/404 for non-existent user (not 500)",
  },
  {
    name: "Login with invitation code",
    payload: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      invitationCode: "TEST123",
    },
    expectedStatus: [401, 404],
    description: "Should handle invitation code without 500 error",
  },
]

// Function to make HTTP request
async function makeRequest(url, data) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Firebase-Test-Script/1.0",
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    let responseData
    const contentType = response.headers.get("content-type")

    if (contentType && contentType.includes("application/json")) {
      try {
        responseData = await response.json()
      } catch (parseError) {
        responseData = { error: "Failed to parse JSON response" }
      }
    } else {
      const text = await response.text()
      responseData = { error: "Non-JSON response", body: text.substring(0, 500) }
    }

    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData,
    }
  } catch (error) {
    clearTimeout(timeoutId)

    if (error.name === "AbortError") {
      throw new Error("Request timeout after 10 seconds")
    }

    throw error
  }
}

// Function to test the login endpoint
async function testLoginEndpoint(testCase) {
  console.log(`\n🧪 Test: ${testCase.name}`)
  console.log(`   Description: ${testCase.description}`)
  console.log(
    `   Payload: ${JSON.stringify({
      ...testCase.payload,
      password: testCase.payload?.password ? "********" : undefined,
    })}`,
  )

  try {
    const response = await makeRequest(LOGIN_ENDPOINT, testCase.payload)
    const status = response.status

    console.log(`   Response Status: ${status}`)

    // Check if status matches expected
    const expectedStatuses = Array.isArray(testCase.expectedStatus)
      ? testCase.expectedStatus
      : [testCase.expectedStatus]

    const isExpectedStatus = expectedStatuses.includes(status)

    if (isExpectedStatus) {
      console.log(`   Result: ✅ EXPECTED (${status})`)
    } else {
      console.log(`   Result: ⚠️  UNEXPECTED (got ${status}, expected ${expectedStatuses.join(" or ")})`)
    }

    // Log response data
    if (response.data) {
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`)
    }

    // Special handling for 500 errors
    if (status === 500) {
      console.error("   🚨 500 INTERNAL SERVER ERROR DETECTED!")
      console.error("   This is the error we're trying to debug.")

      if (response.data && response.data.error) {
        console.error(`   Error Message: ${response.data.error}`)
      }

      if (response.data && response.data.details) {
        console.error(`   Error Details: ${JSON.stringify(response.data.details, null, 2)}`)
      }
    }

    return {
      success: status !== 500, // Consider it successful if we don't get a 500
      status,
      data: response.data,
      expected: isExpectedStatus,
    }
  } catch (error) {
    console.error(`   Result: ❌ REQUEST FAILED`)
    console.error(`   Error: ${error.message}`)

    return {
      success: false,
      error: error.message,
      expected: false,
    }
  }
}

// Health check for the API
async function healthCheck() {
  console.log("🏥 API Health Check...")

  try {
    const healthUrl = `${APP_URL}/api/health`
    console.log(`   Checking: ${healthUrl}`)

    const response = await makeRequest(healthUrl, {})
    console.log(`   Health Status: ${response.status}`)

    if (response.data) {
      console.log(`   Health Response: ${JSON.stringify(response.data, null, 2)}`)
    }

    return response.status === 200
  } catch (error) {
    console.log(`   Health Check Failed: ${error.message}`)
    console.log("   💡 Consider creating a /api/health endpoint for debugging")
    return false
  }
}

// Run all test cases
async function runTests() {
  console.log("🚀 Starting Login Endpoint Tests...\n")

  // First, do a health check
  const isHealthy = await healthCheck()
  console.log("")

  if (!isHealthy) {
    console.log("⚠️  API health check failed, but continuing with login tests...")
    console.log("")
  }

  const results = []

  for (const testCase of testCases) {
    const result = await testLoginEndpoint(testCase)
    results.push({
      name: testCase.name,
      ...result,
    })

    // Add a small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  // Print summary
  console.log("\n📊 Test Summary:")
  console.log("=".repeat(50))

  let has500Errors = false
  let unexpectedResults = 0

  results.forEach((result) => {
    const statusIcon = result.success ? "✅" : "❌"
    const expectedIcon = result.expected ? "✅" : "⚠️"

    console.log(`${statusIcon} ${result.name}:`)
    console.log(`   Status: ${result.status || result.error}`)
    console.log(`   Expected: ${expectedIcon}`)

    if (result.status === 500) {
      has500Errors = true
    }

    if (!result.expected) {
      unexpectedResults++
    }
  })

  console.log("\n📈 Summary Statistics:")
  console.log(`   Total Tests: ${results.length}`)
  console.log(`   Successful Requests: ${results.filter((r) => r.success).length}`)
  console.log(`   500 Errors: ${results.filter((r) => r.status === 500).length}`)
  console.log(`   Unexpected Results: ${unexpectedResults}`)

  // Final assessment
  if (has500Errors) {
    console.error("\n❌ CRITICAL: 500 Internal Server Errors detected!")
    console.error("   This indicates server-side issues in your login API.")
    console.error("   Check your server logs and Firebase configuration.")
    process.exit(1)
  } else if (unexpectedResults > 0) {
    console.log("\n⚠️  Some unexpected results, but no 500 errors.")
    console.log("   Your API is responding, but behavior might not be as expected.")
    process.exit(0)
  } else {
    console.log("\n✅ All tests completed successfully!")
    console.log("   No 500 Internal Server Errors detected.")
    console.log("   Your login API appears to be working correctly.")
    process.exit(0)
  }
}

runTests().catch((error) => {
  console.error("❌ Unhandled error during tests:", error)
  process.exit(1)
})
