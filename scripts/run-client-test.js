const { spawn } = require("child_process")
const path = require("path")

console.log("🚀 Running client flow test...")

// Get the real user ID from environment or prompt
const realUserId = process.env.REAL_USER_ID || "5tVdK6LXCifZgjXD7rml3nEOXmh1"

console.log(`👤 Using User ID: ${realUserId}`)
console.log("💡 To use a different user ID, set REAL_USER_ID environment variable")

// Set environment variables
const env = {
  ...process.env,
  REAL_USER_ID: realUserId,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
}

// Run the test script
const testScript = path.join(__dirname, "test-client-flow.js")
const child = spawn("node", [testScript], {
  env: env,
  stdio: "inherit",
})

child.on("close", (code) => {
  if (code === 0) {
    console.log("\n✅ Test completed successfully!")
  } else {
    console.log(`\n❌ Test failed with exit code: ${code}`)
  }
  process.exit(code)
})

child.on("error", (error) => {
  console.error("💥 Failed to run test:", error)
  process.exit(1)
})
