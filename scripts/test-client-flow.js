// End-to-end test for client flow
// Run with: node scripts/test-client-flow.js

const https = require("https")
const http = require("http")

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
const TEST_USER_ID = "test-trainer-123" // Replace with actual user ID

console.log("🚀 Starting end-to-end client flow test...")
console.log("📍 Base URL:", BASE_URL)
console.log("👤 Test User ID:", TEST_USER_ID)

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
        Cookie: `user_id=${TEST_USER_ID}`,
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

// Test steps
async function runTests() {
  try {
    console.log("\n📋 Step 1: Debug - Check existing data")
    const debugResponse = await makeRequest(`${BASE_URL}/api/debug/clients`)
    console.log("🔍 Debug response status:", debugResponse.status)
    console.log("🔍 Debug response data:", JSON.stringify(debugResponse.data, null, 2))

    console.log("\n📋 Step 2: Create test client")
    const createResponse = await makeRequest(`${BASE_URL}/api/debug/create-test-client`, {
      method: "POST",
    })
    console.log("🧪 Create test client status:", createResponse.status)
    console.log("🧪 Create test client data:", JSON.stringify(createResponse.data, null, 2))

    console.log("\n📋 Step 3: Fetch clients via API")
    const fetchResponse = await makeRequest(`${BASE_URL}/api/clients`)
    console.log("📥 Fetch clients status:", fetchResponse.status)
    console.log("📥 Fetch clients data:", JSON.stringify(fetchResponse.data, null, 2))

    console.log("\n📋 Step 4: Debug again to see changes")
    const debugResponse2 = await makeRequest(`${BASE_URL}/api/debug/clients`)
    console.log("🔍 Debug response 2 status:", debugResponse2.status)
    console.log("🔍 Debug response 2 data:", JSON.stringify(debugResponse2.data, null, 2))

    // Analysis
    console.log("\n📊 ANALYSIS:")
    console.log("=".repeat(50))

    if (debugResponse.data?.debug) {
      const debug = debugResponse.data.debug
      console.log("👤 User exists:", debug.userExists)
      console.log("📁 Raw document count:", debug.rawDocumentCount)
      console.log("🔧 Service client count:", debug.serviceClientCount)
      console.log("📄 Raw documents:", debug.rawDocuments?.length || 0)

      if (debug.rawDocumentCount > 0 && debug.serviceClientCount === 0) {
        console.log("⚠️  ISSUE FOUND: Raw documents exist but service returns 0 clients")
        console.log("🔍 This suggests a validation or mapping issue")

        if (debug.rawDocuments && debug.rawDocuments.length > 0) {
          console.log("📄 Sample raw document:", debug.rawDocuments[0])
        }
      }
    }

    if (fetchResponse.data?.clients) {
      console.log("📥 API returned clients:", fetchResponse.data.clients.length)
    }

    console.log("\n✅ End-to-end test completed")
  } catch (error) {
    console.error("💥 Test failed:", error)
  }
}

// Run the tests
runTests()
