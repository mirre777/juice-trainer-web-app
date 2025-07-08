#!/usr/bin/env node

/**
 * Login Endpoint Test
 * This script tests the login API endpoint directly
 */

const https = require("https")
const http = require("http")

async function testLoginEndpoint() {
  console.log("🔐 Testing Login API Endpoint...\n")

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const endpoint = "/api/auth/login"
  const fullUrl = `${baseUrl}${endpoint}`

  console.log(`Testing URL: ${fullUrl}`)

  // Test data
  const testCases = [
    {
      name: "Missing email and password",
      data: {},
      expectedStatus: 400,
    },
    {
      name: "Missing password",
      data: { email: "test@example.com" },
      expectedStatus: 400,
    },
    {
      name: "Invalid email format",
      data: { email: "invalid-email", password: "password123" },
      expectedStatus: 400,
    },
    {
      name: "Non-existent user",
      data: { email: "nonexistent@example.com", password: "password123" },
      expectedStatus: 404,
    },
  ]

  for (const testCase of testCases) {
    console.log(`\n🧪 Test: ${testCase.name}`)
    console.log(`   Data: ${JSON.stringify(testCase.data)}`)

    try {
      const response = await makeRequest(fullUrl, testCase.data)
      console.log(`   Status: ${response.status}`)
      console.log(`   Expected: ${testCase.expectedStatus}`)

      if (response.status === testCase.expectedStatus) {
        console.log("   Result: ✅ PASS")
      } else {
        console.log("   Result: ❌ FAIL")
      }

      if (response.data) {
        console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`)
      }
    } catch (error) {
      console.log(`   Result: ❌ ERROR - ${error.message}`)

      // If we get a 500 error, that's what we're trying to debug
      if (error.status === 500) {
        console.log("   🚨 This is the 500 error we're investigating!")
        console.log(`   Error details: ${error.message}`)
        if (error.response) {
          console.log(`   Response body: ${error.response}`)
        }
      }
    }
  }
}

function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const isHttps = urlObj.protocol === "https:"
    const client = isHttps ? https : http

    const postData = JSON.stringify(data)

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    }

    const req = client.request(options, (res) => {
      let responseBody = ""

      res.on("data", (chunk) => {
        responseBody += chunk
      })

      res.on("end", () => {
        try {
          const data = responseBody ? JSON.parse(responseBody) : null
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
          })
        } catch (parseError) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseBody,
          })
        }
      })
    })

    req.on("error", (error) => {
      reject({
        message: error.message,
        status: null,
        response: null,
      })
    })

    req.on("timeout", () => {
      req.destroy()
      reject({
        message: "Request timeout",
        status: null,
        response: null,
      })
    })

    req.setTimeout(10000) // 10 second timeout
    req.write(postData)
    req.end()
  })
}

// Health check for the API
async function healthCheck() {
  console.log("🏥 API Health Check...\n")

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  try {
    const response = await makeRequest(`${baseUrl}/api/health`, {})
    console.log(`Health check status: ${response.status}`)
    if (response.data) {
      console.log(`Health check response: ${JSON.stringify(response.data)}`)
    }
  } catch (error) {
    console.log(`Health check failed: ${error.message}`)
    console.log("Creating a simple health check endpoint might help with debugging")
  }
}

// Run the tests
if (require.main === module) {
  console.log("🚀 Starting Login Endpoint Tests...\n")

  healthCheck()
    .then(() => testLoginEndpoint())
    .then(() => {
      console.log("\n✅ Login endpoint tests completed!")
    })
    .catch((error) => {
      console.error("\n❌ Tests failed:", error)
      process.exit(1)
    })
}

module.exports = { testLoginEndpoint, makeRequest }
