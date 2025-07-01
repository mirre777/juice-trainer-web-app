const { spawn } = require("child_process")

const userId = process.env.REAL_USER_ID || "5tVdK6LXCifZgjXD7rml3nEOXmh1"

console.log("🚀 Running Client Flow Test")
console.log("👤 Using User ID:", userId)

const testProcess = spawn("node", ["scripts/test-client-flow.js"], {
  env: { ...process.env, REAL_USER_ID: userId },
  stdio: "inherit",
})

testProcess.on("close", (code) => {
  if (code === 0) {
    console.log("✅ All tests passed!")
  } else {
    console.log("❌ Test failed with exit code:", code)
  }
  process.exit(code)
})

testProcess.on("error", (error) => {
  console.error("❌ Failed to start test:", error)
  process.exit(1)
})
