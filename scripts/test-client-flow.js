// End-to-end test for client flow using real user data
const https = require("https")
const http = require("http")

// Get the actual user ID from environment
const REAL_USER_ID = process.env.REAL_USER_ID || "5tVdK6LXCifZgjXD7rml3nEOXmh1"
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

console.log("🚀 Starting REAL end-to-end client flow test...")
console.log("📍 Base URL:", BASE_URL)
console.log("👤 Real User ID:", REAL_USER_ID)

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const isHttps = urlObj.protocol === "https:"
    const client = isHttps ? https : http

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: `user_id=${REAL_USER_ID}`,
        ...options.headers,
      },
    }

    const req = client.request(requestOptions, (res) => {
      let data = ""
      res.on("data", (chunk) => {
        data += chunk
      })
      res.on("end", () => {
        try {
          const jsonData = JSON.parse(data)
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
          })
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
          })
        }
      })
    })

    req.on("error", (error) => {
      reject(error)
    })

    if (options.body) {
      req.write(JSON.stringify(options.body))
    }

    req.end()
  })
}

// Test the complete flow
async function runRealTest() {
  console.log("\n" + "=".repeat(60))
  console.log("🧪 REAL CLIENT FLOW TEST")
  console.log("=".repeat(60))

  let testsPassed = 0
  let testsTotal = 0
  let hasError = false

  try {
    // Test 1: Debug existing data
    testsTotal++
    console.log("\n📋 TEST 1: Analyze existing client data")
    console.log("-".repeat(40))

    const debugResponse = await makeRequest(`${BASE_URL}/api/debug/clients`)
    console.log("🔍 Debug response status:", debugResponse.status)
    console.log("🔍 Debug response data:", JSON.stringify(debugResponse.data, null, 2))

    if (debugResponse.status === 200 && debugResponse.data?.success) {
      const debug = debugResponse.data.debug
      console.log("✅ Debug endpoint working")
      console.log("📊 Analysis results:")
      console.log(`  - User ID: ${debug.userId}`)
      console.log(`  - Collection path: ${debug.collectionPath}`)
      console.log(`  - Raw documents found: ${debug.rawDocumentCount}`)
      console.log(`  - Service returned clients: ${debug.serviceClientCount}`)
      console.log(`  - Valid documents: ${debug.validDocuments}`)
      console.log(`  - Invalid documents: ${debug.invalidDocuments}`)

      // Show validation details for invalid documents
      if (debug.validationResults) {
        debug.validationResults.forEach((result, index) => {
          if (!result.isValid) {
            console.log(`❌ Invalid document ${index + 1} (${result.documentId}):`)
            console.log(`   Validation details:`, result.validationDetails)
            console.log(`   Raw data keys:`, Object.keys(result.rawData || {}))
          }
        })
      }

      testsPassed++
    } else {
      console.log("❌ Debug endpoint failed")
      console.log("Response:", debugResponse.data)
      hasError = true
    }

    // Test 2: Fetch clients via API
    testsTotal++
    console.log("\n📋 TEST 2: Fetch clients via API")
    console.log("-".repeat(40))

    const fetchResponse = await makeRequest(`${BASE_URL}/api/clients`)
    console.log("📥 Fetch response status:", fetchResponse.status)
    console.log("📥 Fetch response data:", JSON.stringify(fetchResponse.data, null, 2))

    if (fetchResponse.status === 200 && fetchResponse.data?.success) {
      const clients = fetchResponse.data.clients || []
      console.log("✅ API fetch working")
      console.log(`📊 Clients returned: ${clients.length}`)

      if (clients.length > 0) {
        console.log("👥 Client list:")
        clients.forEach((client, index) => {
          console.log(`  ${index + 1}. ${client.name} (${client.status}) - ID: ${client.id}`)
        })
      }

      testsPassed++
    } else {
      console.log("❌ API fetch failed")
      console.log("Response:", fetchResponse.data)
      hasError = true
    }

    // Test 3: Create a test client
    testsTotal++
    console.log("\n📋 TEST 3: Create test client")
    console.log("-".repeat(40))

    const createResponse = await makeRequest(`${BASE_URL}/api/debug/create-test-client`, {
      method: "POST",
    })
    console.log("🧪 Create response status:", createResponse.status)
    console.log("🧪 Create response data:", JSON.stringify(createResponse.data, null, 2))

    let testClientId = null
    if (createResponse.status === 200 && createResponse.data?.success) {
      testClientId = createResponse.data.clientId
      console.log("✅ Test client created successfully")
      console.log("🆔 Test client ID:", testClientId)
      testsPassed++
    } else {
      console.log("❌ Failed to create test client")
      console.log("Response:", createResponse.data)
      hasError = true
    }

    // Final Analysis
    console.log("\n" + "=".repeat(60))
    console.log("📊 FINAL ANALYSIS")
    console.log("=".repeat(60))

    console.log(`🧪 Tests passed: ${testsPassed}/${testsTotal}`)

    if (debugResponse.data?.debug) {
      const debug = debugResponse.data.debug

      if (debug.rawDocumentCount > 0 && debug.serviceClientCount === 0) {
        console.log("\n🚨 PROBLEM IDENTIFIED:")
        console.log("   Raw documents exist but service returns 0 clients")
        console.log("   This indicates a validation or mapping issue")
        console.log("\n🔧 RECOMMENDED ACTIONS:")
        console.log("   1. Check the validation logic in isValidClientData()")
        console.log("   2. Verify the data structure matches expectations")
        console.log("   3. Check for missing required fields")
        hasError = true
      } else if (debug.rawDocumentCount === 0) {
        console.log("\n🚨 PROBLEM IDENTIFIED:")
        console.log("   No documents found in the collection")
        console.log("   This indicates a collection path or authentication issue")
        console.log("\n🔧 RECOMMENDED ACTIONS:")
        console.log("   1. Verify the collection path: users/{userId}/clients")
        console.log("   2. Check if the user ID is correct")
        console.log("   3. Verify Firestore permissions")
        hasError = true
      } else if (debug.rawDocumentCount > 0 && debug.serviceClientCount > 0) {
        console.log("\n✅ FLOW WORKING:")
        console.log("   Documents exist and service is returning clients")
        console.log("   The issue might be in the UI component")
      }
    }

    if (testsPassed === testsTotal && !hasError) {
      console.log("\n🎉 ALL TESTS PASSED!")
      process.exit(0)
    } else {
      console.log("\n❌ SOME TESTS FAILED OR ISSUES FOUND")
      process.exit(1)
    }
  } catch (error) {
    console.error("\n💥 TEST SUITE FAILED:", error)
    process.exit(1)
  }
}

// Run the real test
runRealTest()
