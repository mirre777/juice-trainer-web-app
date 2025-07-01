#!/usr/bin/env node

const https = require("https")
const http = require("http")

const BASE_URL = "https://v0-coachingplatform-git-revert-back-t-75a0c2-mirre777s-projects.vercel.app"
const USER_ID = process.env.REAL_USER_ID || "5tVdK6LXCifZgjXD7rml3nEOXmh1"

console.log("🧪 Testing Client Flow")
console.log("👤 User ID:", USER_ID)

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http
    const requestOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Node.js Test Script",
        ...options.headers,
      },
      ...options,
    }

    console.log(`📡 Making ${requestOptions.method} request to: ${url}`)

    const req = protocol.request(url, requestOptions, (res) => {
      let data = ""

      res.on("data", (chunk) => {
        data += chunk
      })

      res.on("end", () => {
        console.log(`📊 Response status: ${res.statusCode}`)
        console.log(`📊 Response headers:`, res.headers)

        try {
          const jsonData = JSON.parse(data)
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
          })
        } catch (parseError) {
          // If it's not JSON, return the raw data
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            raw: true,
          })
        }
      })
    })

    req.on("error", (error) => {
      console.error(`❌ Request error:`, error.message)
      reject(error)
    })

    if (options.body) {
      req.write(JSON.stringify(options.body))
    }

    req.end()
  })
}

async function runTests() {
  try {
    console.log("🔍 Step 1: Running comprehensive debug analysis...")

    try {
      const debugResponse = await makeRequest(`${BASE_URL}/api/debug/clients`)

      if (debugResponse.status === 200 && !debugResponse.raw) {
        console.log("✅ Debug analysis successful!")
        console.log("📊 Debug summary:", debugResponse.data.debug?.summary)

        if (debugResponse.data.debug?.documents) {
          console.log("📄 First few documents:")
          debugResponse.data.debug.documents.slice(0, 3).forEach((doc, index) => {
            console.log(
              `  ${index + 1}. ${doc.documentId}: ${doc.validation.nameValue} (valid: ${doc.validation.isValidName})`,
            )
          })
        }
      } else {
        console.log(`❌ Debug endpoint failed: ${debugResponse.status}`, debugResponse.data?.substring(0, 200))
      }
    } catch (debugError) {
      console.log("❌ Debug endpoint error:", debugError.message)
    }

    console.log("\n🧪 Step 2: Creating test client...")

    try {
      const createResponse = await makeRequest(`${BASE_URL}/api/debug/create-test-client`, {
        method: "POST",
      })

      if (createResponse.status === 200 && !createResponse.raw) {
        console.log("✅ Test client created successfully!")
        console.log("🆔 Client ID:", createResponse.data.clientId)
      } else {
        console.log(`❌ Failed to create test client: ${createResponse.status}`, createResponse.data?.substring(0, 200))
      }
    } catch (createError) {
      console.log("❌ Create test client error:", createError.message)
    }

    console.log("\n📡 Step 3: Testing API fetch...")

    try {
      const apiResponse = await makeRequest(`${BASE_URL}/api/clients`)

      if (apiResponse.status === 200 && !apiResponse.raw) {
        console.log("✅ API fetch successful!")
        console.log("📊 Client count:", apiResponse.data.clients?.length || 0)
        console.log("📊 API response:", apiResponse.data)
      } else {
        console.log(`❌ API fetch failed: ${apiResponse.status}`)
        console.log("Error details:", apiResponse.data?.substring(0, 500))
      }
    } catch (apiError) {
      console.log("❌ API fetch error:", apiError.message)
    }

    console.log("\n✅ Test completed!")
  } catch (error) {
    console.error("💥 Test failed:", error.message)
    process.exit(1)
  }
}

// Run the tests
runTests().catch((error) => {
  console.error("💥 Unexpected error:", error)
  process.exit(1)
})
