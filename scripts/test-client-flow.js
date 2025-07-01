const https = require("https")
const http = require("http")

const USER_ID = process.env.REAL_USER_ID || "5tVdK6LXCifZgjXD7rml3nEOXmh1"
const BASE_URL =
  process.env.BASE_URL || "https://v0-coachingplatform-git-revert-back-t-75a0c2-mirre777s-projects.vercel.app"

console.log("🧪 Testing Client Flow")
console.log("👤 User ID:", USER_ID)

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
        "User-Agent": "Node.js Test Client",
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
        } catch (parseError) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: parseError.message,
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

async function runTests() {
  try {
    console.log("🔍 Step 1: Running comprehensive debug analysis...")

    try {
      const debugResponse = await makeRequest(`${BASE_URL}/api/debug/clients`)
      if (debugResponse.status === 200) {
        console.log("✅ Debug endpoint successful")
        console.log("📊 Debug summary:", debugResponse.data?.debug?.summary)
      } else {
        console.log(
          `❌ Debug endpoint failed: ${debugResponse.status}`,
          debugResponse.data?.error || debugResponse.data,
        )
      }
    } catch (debugError) {
      console.log("❌ Debug endpoint failed:", debugError.message)
    }

    console.log("\n🧪 Step 2: Creating test client...")

    try {
      const createResponse = await makeRequest(`${BASE_URL}/api/debug/create-test-client`, {
        method: "POST",
      })
      if (createResponse.status === 200) {
        console.log("✅ Test client created:", createResponse.data?.clientId)
      } else {
        console.log(
          `❌ Failed to create test client: ${createResponse.status}`,
          createResponse.data?.error || createResponse.data,
        )
      }
    } catch (createError) {
      console.log("❌ Failed to create test client:", createError.message)
    }

    console.log("\n📡 Step 3: Testing API fetch...")

    try {
      const apiResponse = await makeRequest(`${BASE_URL}/api/clients`)
      if (apiResponse.status === 200) {
        console.log("✅ API fetch successful")
        console.log("📊 Client count:", apiResponse.data?.clients?.length || 0)
        console.log("📊 Response:", apiResponse.data)
      } else {
        console.log(`❌ API fetch failed: ${apiResponse.status}`)
        console.log("Error details:", apiResponse.data?.error || apiResponse.data)
      }
    } catch (apiError) {
      console.log("❌ API fetch failed:", apiError.message)
    }

    console.log("\n✅ Test completed")
  } catch (error) {
    console.error("❌ Test failed:", error.message)
    process.exit(1)
  }
}

runTests()
