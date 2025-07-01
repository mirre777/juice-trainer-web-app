#!/usr/bin/env node

// Simple test runner for client flow
const { spawn } = require("child_process")
const path = require("path")

console.log("🧪 Running Client Flow End-to-End Test")
console.log("=".repeat(50))

// Get the test user ID from environment or use default
const testUserId = process.env.TEST_USER_ID || "StVdK6LXCifZgjXD7ml3nEOXmh1"

console.log("👤 Test User ID:", testUserId)
console.log("🌐 App URL:", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")

// Set environment variable for the test
process.env.TEST_USER_ID = testUserId

// Run the test script
const testScript = path.join(__dirname, "test-client-flow.js")
const child = spawn("node", [testScript], {
  stdio: "inherit",
  env: { ...process.env, TEST_USER_ID: testUserId },
})

child.on("close", (code) => {
  console.log(`\n🏁 Test completed with exit code: ${code}`)
  if (code === 0) {
    console.log("✅ All tests passed!")
  } else {
    console.log("❌ Some tests failed")
  }
})

child.on("error", (error) => {
  console.error("💥 Failed to run test:", error)
})
