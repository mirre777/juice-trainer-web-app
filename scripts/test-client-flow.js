// End-to-end test for client flow using real user data
// Run with: node scripts/test-client-flow.js

const https = require("https")
const http = require("http")

// Get the actual user ID from environment or use the one from your browser
const REAL_USER_ID = process.env.REAL_USER_ID || "5tVdK6LXCifZgjXD7rml3nEOXmh1" // Replace with your actual user ID
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

  try {
    // Test 1: Debug existing data
    testsTotal++
    console.log("\n📋 TEST 1: Analyze existing client data")
    console.log("-".repeat(40))

    const debugResponse = await makeRequest(`${BASE_URL}/api/debug/clients`)
    console.log("🔍 Debug response status:", debugResponse.status)

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

      // Show sample raw document if exists
      if (debug.rawDocuments && debug.rawDocuments.length > 0) {
        console.log("📄 Sample raw document:")
        console.log(JSON.stringify(debug.rawDocuments[0], null, 2))
      }

      // Show validation details for invalid documents
      if (debug.validationResults) {
        debug.validationResults.forEach((result, index) => {
          if (!result.isValid) {
            console.log(`❌ Invalid document ${index + 1} (${result.documentId}):`)
            console.log(`   Validation details:`, result.validationDetails)
            console.log(`   Raw data:`, result.rawData)
          }
        })
      }

      testsPassed++
    } else {
      console.log("❌ Debug endpoint failed:", debugResponse.data)
    }

    // Test 2: Create a test client to ensure the flow works
    testsTotal++
    console.log("\n📋 TEST 2: Create test client")
    console.log("-".repeat(40))

    const createResponse = await makeRequest(`${BASE_URL}/api/debug/create-test-client`, {
      method: "POST",
    })
    console.log("🧪 Create response status:", createResponse.status)

    let testClientId = null
    if (createResponse.status === 200 && createResponse.data?.success) {
      testClientId = createResponse.data.clientId
      console.log("✅ Test client created successfully")
      console.log("🆔 Test client ID:", testClientId)
      testsPassed++
    } else {
      console.log("❌ Failed to create test client:", createResponse.data)
    }

    // Test 3: Fetch clients via API
    testsTotal++
    console.log("\n📋 TEST 3: Fetch clients via API")
    console.log("-".repeat(40))

    const fetchResponse = await makeRequest(`${BASE_URL}/api/clients`)
    console.log("📥 Fetch response status:", fetchResponse.status)

    if (fetchResponse.status === 200 && fetchResponse.data?.success) {
      const clients = fetchResponse.data.clients || []
      console.log("✅ API fetch working")
      console.log(`📊 Clients returned: ${clients.length}`)

      if (clients.length > 0) {
        console.log("👥 Client list:")
        clients.forEach((client, index) => {
          console.log(`  ${index + 1}. ${client.name} (${client.status}) - ID: ${client.id}`)
        })

        // Check if our test client is in the list
        if (testClientId && clients.some((c) => c.id === testClientId)) {
          console.log("✅ Test client found in API response")
        } else if (testClientId) {
          console.log("⚠️  Test client NOT found in API response")
        }
      }

      testsPassed++
    } else {
      console.log("❌ API fetch failed:", fetchResponse.data)
    }

    // Test 4: Debug again to see the changes
    testsTotal++
    console.log("\n📋 TEST 4: Verify changes")
    console.log("-".repeat(40))

    const debugResponse2 = await makeRequest(`${BASE_URL}/api/debug/clients`)
    if (debugResponse2.status === 200 && debugResponse2.data?.success) {
      const debug2 = debugResponse2.data.debug
      console.log("✅ Second debug check working")
      console.log(
        `📊 Updated counts: ${debug2.rawDocumentCount} raw docs, ${debug2.serviceClientCount} service clients`,
      )
      testsPassed++
    } else {
      console.log("❌ Second debug check failed")
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
      } else if (debug.rawDocumentCount === 0) {
        console.log("\n🚨 PROBLEM IDENTIFIED:")
        console.log("   No documents found in the collection")
        console.log("   This indicates a collection path or authentication issue")
        console.log("\n🔧 RECOMMENDED ACTIONS:")
        console.log("   1. Verify the collection path: users/{userId}/clients")
        console.log("   2. Check if the user ID is correct")
        console.log("   3. Verify Firestore permissions")
      } else if (debug.rawDocumentCount > 0 && debug.serviceClientCount > 0) {
        console.log("\n✅ FLOW WORKING:")
        console.log("   Documents exist and service is returning clients")
        console.log("   The issue might be in the UI component")
      }
    }

    if (testsPassed === testsTotal) {
      console.log("\n🎉 ALL TESTS PASSED!")
      process.exit(0)
    } else {
      console.log("\n❌ SOME TESTS FAILED")
      process.exit(1)
    }
  } catch (error) {
    console.error("\n💥 TEST SUITE FAILED:", error)
    process.exit(1)
  }
}

// Run the real test
runRealTest()
