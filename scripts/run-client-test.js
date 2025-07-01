#!/usr/bin/env node

const { spawn } = require("child_process")
const path = require("path")

console.log("🚀 Running Client Flow Test")

// Set environment variables
const env = {
  ...process.env,
  REAL_USER_ID: process.env.REAL_USER_ID || "5tVdK6LXCifZgjXD7rml3nEOXmh1",
}

console.log("👤 Using User ID:", env.REAL_USER_ID)

// Run the test script
const testScript = path.join(__dirname, "test-client-flow.js")
const child = spawn("node", [testScript], {
  env,
  stdio: "inherit",
})

child.on("close", (code) => {
  if (code === 0) {
    console.log("✅ Test completed successfully")
  } else {
    console.log(`❌ Test failed with exit code: ${code}`)
    process.exit(code)
  }
})

child.on("error", (error) => {
  console.error("💥 Failed to start test:", error.message)
  process.exit(1)
})
