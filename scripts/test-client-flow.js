const https = require("https")

const REAL_USER_ID = process.env.REAL_USER_ID || "5tVdK6LXCifZgjXD7rml3nEOXmh1"
const BASE_URL = "https://v0-coachingplatform-git-revert-back-t-75a0c2-mirre777s-projects.vercel.app"

console.log("🚀 Running Client Flow Test")
console.log("👤 Using User ID:", REAL_USER_ID)

async function makeRequest(path, method = "GET", data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "v0-coachingplatform-git-revert-back-t-75a0c2-mirre777s-projects.vercel.app",
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
        Cookie: `user_id=${REAL_USER_ID}`,
      },
    }

    if (data) {
      const jsonData = JSON.stringify(data)
      options.headers["Content-Length"] = Buffer.byteLength(jsonData)
    }

    const req = https.request(options, (res) => {
      let responseData = ""

      res.on("data", (chunk) => {
        responseData += chunk
      })

      res.on("end", () => {
        try {
          const parsed = JSON.parse(responseData)
          resolve({
            status: res.statusCode,
            data: parsed,
            headers: res.headers,
          })
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData,
            headers: res.headers,
          })
        }
      })
    })

    req.on("error", (error) => {
      reject(error)
    })

    if (data) {
      req.write(JSON.stringify(data))
    }

    req.end()
  })
}

async function runTests() {
  try {
    console.log("\n🔍 Step 1: Running comprehensive debug analysis...")
    const debugResponse = await makeRequest("/api/debug/clients")

    if (debugResponse.status === 200) {
      console.log("✅ Debug endpoint successful")
      const debug = debugResponse.data.debug

      console.log("\n📊 Debug Summary:")
      console.log(`  - User exists: ${debug.userDocument.exists}`)
      console.log(`  - Collection path: ${debug.collection.path}`)
      console.log(`  - Total documents: ${debug.collection.documentCount}`)
      console.log(`  - Valid documents: ${debug.summary.validDocuments}`)
      console.log(`  - Invalid documents: ${debug.summary.invalidDocuments}`)

      if (debug.documents.length > 0) {
        console.log("\n📄 Document Details:")
        debug.documents.forEach((doc, index) => {
          console.log(`  ${index + 1}. ID: ${doc.documentId}`)
          console.log(`     Name: "${doc.validation.nameValue}" (${doc.validation.nameType})`)
          console.log(`     Valid: ${doc.validation.isValidName}`)
          console.log(`     Status: ${doc.rawData.status}`)
        })
      }

      if (debug.alternativePaths.length > 0) {
        console.log("\n🔍 Alternative Paths:")
        debug.alternativePaths.forEach((alt) => {
          if (alt.documentCount > 0) {
            console.log(`  ✅ ${alt.path}: ${alt.documentCount} documents`)
          } else if (alt.error) {
            console.log(`  ❌ ${alt.path}: ${alt.error}`)
          } else {
            console.log(`  ⚪ ${alt.path}: 0 documents`)
          }
        })
      }
    } else {
      console.log("❌ Debug endpoint failed:", debugResponse.status, debugResponse.data)
    }

    console.log("\n🧪 Step 2: Creating test client...")
    const createResponse = await makeRequest("/api/debug/create-test-client", "POST")

    if (createResponse.status === 200) {
      console.log("✅ Test client created:", createResponse.data.clientId)
    } else {
      console.log("❌ Failed to create test client:", createResponse.status, createResponse.data)
    }

    console.log("\n📡 Step 3: Testing API fetch...")
    const apiResponse = await makeRequest("/api/clients")

    if (apiResponse.status === 200) {
      console.log("✅ API fetch successful")
      console.log(`📊 Clients returned: ${apiResponse.data.clients.length}`)

      if (apiResponse.data.clients.length > 0) {
        console.log("👥 Client List:")
        apiResponse.data.clients.forEach((client, index) => {
          console.log(`  ${index + 1}. ${client.name} (${client.email}) - ${client.status}`)
        })
      } else {
        console.log("⚠️  No clients returned from API")
      }

      if (apiResponse.data.debug) {
        console.log("\n🔧 API Debug Info:")
        console.log(`  - Total documents: ${apiResponse.data.debug.totalDocuments}`)
        console.log(`  - Valid count: ${apiResponse.data.debug.validCount}`)
        console.log(`  - Invalid count: ${apiResponse.data.debug.invalidCount}`)
      }
    } else {
      console.log("❌ API fetch failed:", apiResponse.status)
      console.log("Error details:", apiResponse.data)
      process.exit(1)
    }

    console.log("\n🎉 All tests completed successfully!")
  } catch (error) {
    console.error("💥 Test failed:", error.message)
    process.exit(1)
  }
}

runTests()
