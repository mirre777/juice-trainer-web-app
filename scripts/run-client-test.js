const { spawn } = require("child_process")
const path = require("path")

console.log("🚀 Running client flow test...")

// Get the real user ID from environment or use default
const realUserId = process.env.REAL_USER_ID || "5tVdK6LXCifZgjXD7rml3nEOXmh1"
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

console.log(`👤 Using User ID: ${realUserId}`)
console.log(`🌐 App URL: ${appUrl}`)
console.log("💡 To use a different user ID, set REAL_USER_ID environment variable")

// Validate inputs
if (!realUserId) {
  console.error("❌ No user ID provided")
  process.exit(1)
}

// Set environment variables
const env = {
  ...process.env,
  REAL_USER_ID: realUserId,
  NEXT_PUBLIC_APP_URL: appUrl,
}

// Run the test script
const testScript = path.join(__dirname, "test-client-flow.js")

console.log(`\n🧪 Running test script: ${testScript}`)
console.log("-".repeat(50))

const child = spawn("node", [testScript], {
  env: env,
  stdio: "inherit",
})

child.on("close", (code) => {
  console.log("-".repeat(50))
  if (code === 0) {
    console.log("✅ Test completed successfully!")
  } else {
    console.log(`❌ Test failed with exit code: ${code}`)
    console.log("\n🔧 Common issues:")
    console.log("- Next.js app not running (run 'npm run dev')")
    console.log("- Wrong user ID")
    console.log("- Firebase connection issues")
    console.log("- API endpoints not working")
  }
  process.exit(code)
})

child.on("error", (error) => {
  console.error("💥 Failed to run test:", error)
  process.exit(1)
})
