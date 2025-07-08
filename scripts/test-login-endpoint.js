#!/usr/bin/env node

console.log("🔐 Testing Login Endpoint...\n")

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
const loginUrl = `${baseUrl}/api/auth/login`

console.log(`Testing endpoint: ${loginUrl}\n`)

// Test credentials
const testCredentials = {
  email: process.env.TEST_EMAIL || "mirresnelting+4@gmail.com",
  password: process.env.TEST_PASSWORD || "test123",
}

console.log(`Test credentials: ${testCredentials.email} / ${"*".repeat(testCredentials.password.length)}\n`)

// Test 1: Valid login attempt
console.log("1️⃣ Testing valid login attempt...")

try {
  const response = await fetch(loginUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(testCredentials),
  })

  console.log(`Response status: ${response.status} ${response.statusText}`)
  console.log(`Response headers:`, Object.fromEntries(response.headers.entries()))

  const responseText = await response.text()
  console.log(`Response body: ${responseText}`)

  if (response.ok) {
    console.log("✅ Login successful")
    try {
      const data = JSON.parse(responseText)
      console.log(`User ID: ${data.user?.uid || "N/A"}`)
      console.log(`Email: ${data.user?.email || "N/A"}`)
    } catch (parseError) {
      console.log("⚠️  Could not parse response as JSON")
    }
  } else {
    console.log("❌ Login failed")
    try {
      const errorData = JSON.parse(responseText)
      console.log(`Error: ${errorData.error}`)
      console.log(`Error ID: ${errorData.errorId || "N/A"}`)
    } catch (parseError) {
      console.log("⚠️  Could not parse error response as JSON")
    }
  }
} catch (error) {
  console.log("❌ Request failed:")
  console.log(`   Error: ${error.message}`)

  if (error.code === "ECONNREFUSED") {
    console.log("   💡 Hint: Make sure your development server is running")
  }
}

// Test 2: Invalid credentials
console.log("\n2️⃣ Testing invalid credentials...")

try {
  const response = await fetch(loginUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: testCredentials.email,
      password: "wrongpassword",
    }),
  })

  console.log(`Response status: ${response.status} ${response.statusText}`)

  const responseText = await response.text()

  if (response.status === 401) {
    console.log("✅ Correctly rejected invalid credentials")
  } else {
    console.log("⚠️  Unexpected response for invalid credentials")
    console.log(`Response: ${responseText}`)
  }
} catch (error) {
  console.log("❌ Request failed:")
  console.log(`   Error: ${error.message}`)
}

// Test 3: Missing fields
console.log("\n3️⃣ Testing missing fields...")

try {
  const response = await fetch(loginUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: testCredentials.email,
      // password missing
    }),
  })

  console.log(`Response status: ${response.status} ${response.statusText}`)

  if (response.status === 400) {
    console.log("✅ Correctly rejected missing password")
  } else {
    console.log("⚠️  Unexpected response for missing password")
    const responseText = await response.text()
    console.log(`Response: ${responseText}`)
  }
} catch (error) {
  console.log("❌ Request failed:")
  console.log(`   Error: ${error.message}`)
}

// Test 4: Invalid JSON
console.log("\n4️⃣ Testing invalid JSON...")

try {
  const response = await fetch(loginUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: "invalid json",
  })

  console.log(`Response status: ${response.status} ${response.statusText}`)

  if (response.status === 400) {
    console.log("✅ Correctly rejected invalid JSON")
  } else {
    console.log("⚠️  Unexpected response for invalid JSON")
    const responseText = await response.text()
    console.log(`Response: ${responseText}`)
  }
} catch (error) {
  console.log("❌ Request failed:")
  console.log(`   Error: ${error.message}`)
}

console.log("\n🏁 Login Endpoint Test Complete")
