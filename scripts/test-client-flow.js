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
    try {
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
        timeout: 10000, // 10 second timeout
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
        console.error("Request error:", error)
        reject(error)
      })

      req.on("timeout", () => {
        req.destroy()
        reject(new Error("Request timeout"))
      })

      if (options.body) {
        req.write(JSON.stringify(options.body))
      }

      req.end()
    } catch (error) {
      reject(error)
    }
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

    try {
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
            }
          })
        }

        testsPassed++
      } else {
        console.log("❌ Debug endpoint failed")
        console.log("Response:", JSON.stringify(debugResponse.data, null, 2))
      }
    } catch (error) {
      console.log("❌ Debug test failed:", error.message)
    }

    // Test 2: Create a test client
    testsTotal++
    console.log("\n📋 TEST 2: Create test client")
    console.log("-".repeat(40))

    try {
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
        console.log("❌ Failed to create test client")
        console.log("Response:", JSON.stringify(createResponse.data, null, 2))
      }
    } catch (error) {
      console.log("❌ Create test client failed:", error.message)
    }

    // Test 3: Fetch clients via API
    testsTotal++
    console.log("\n📋 TEST 3: Fetch clients via API")
    console.log("-".repeat(40))

    try {
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
        }

        testsPassed++
      } else {
        console.log("❌ API fetch failed")
        console.log("Response:", JSON.stringify(fetchResponse.data, null, 2))
      }
    } catch (error) {
      console.log("❌ Fetch test failed:", error.message)
    }

    // Final Analysis
    console.log("\n" + "=".repeat(60))
    console.log("📊 FINAL ANALYSIS")
    console.log("=".repeat(60))

    console.log(`🧪 Tests passed: ${testsPassed}/${testsTotal}`)

    if (testsPassed === testsTotal) {
      console.log("\n🎉 ALL TESTS PASSED!")
      return true
    } else {
      console.log("\n❌ SOME TESTS FAILED")
      console.log("\n🔧 TROUBLESHOOTING:")
      console.log("1. Make sure your Next.js app is running (npm run dev)")
      console.log("2. Check that the user ID is correct")
      console.log("3. Verify Firebase connection")
      console.log("4. Check browser console for additional errors")
      return false
    }
  } catch (error) {
    console.error("\n💥 TEST SUITE FAILED:", error)
    return false
  }
}

// Run the test and exit with appropriate code
runRealTest()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error("💥 Unexpected error:", error)
    process.exit(1)
  })
