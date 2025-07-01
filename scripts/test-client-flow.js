const https = require("https")

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = ""
      res.on("data", (chunk) => (data += chunk))
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data)
          resolve({ status: res.statusCode, data: parsed })
        } catch (e) {
          resolve({ status: res.statusCode, data: data })
        }
      })
    })

    req.on("error", reject)
    if (options.body) {
      req.write(options.body)
    }
    req.end()
  })
}

async function testClientFlow() {
  const userId = process.env.REAL_USER_ID
  const baseUrl = "https://localhost:3000"

  console.log("🧪 Testing Client Flow")
  console.log("👤 User ID:", userId)

  if (!userId) {
    console.error("❌ REAL_USER_ID environment variable not set")
    process.exit(1)
  }

  try {
    // Test 1: Check if API returns clients
    console.log("\n📡 Testing API fetch...")
    const apiResponse = await makeRequest(`${baseUrl}/api/clients`, {
      headers: {
        Cookie: `user_id=${userId}`,
      },
    })

    console.log("API Response:", apiResponse.data)

    if (apiResponse.data.success && apiResponse.data.clients.length > 0) {
      console.log("✅ API fetch working - found", apiResponse.data.clients.length, "clients")
    } else {
      console.log("❌ API fetch returning empty array")
    }

    // Test 2: Check debug endpoint
    console.log("\n🔍 Testing debug endpoint...")
    const debugResponse = await makeRequest(`${baseUrl}/api/debug/clients`, {
      headers: {
        Cookie: `user_id=${userId}`,
      },
    })

    console.log("Debug Response:", debugResponse.data)

    console.log("\n✅ Test completed")
  } catch (error) {
    console.error("❌ Test failed:", error.message)
    process.exit(1)
  }
}

testClientFlow()
