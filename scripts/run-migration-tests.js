#!/usr/bin/env node

/**
 * Migration Test Runner
 *
 * This script runs comprehensive tests to verify the unified services migration
 * Run with: node scripts/run-migration-tests.js
 */

const { execSync } = require("child_process")
const path = require("path")

console.log("🧪 Unified Services Migration Test Runner")
console.log("==========================================\n")

// Check if Next.js dev server is running
function checkDevServer() {
  try {
    const { default: fetch } = require("node-fetch")
    return fetch("http://localhost:3000/api/health")
      .then((res) => res.ok)
      .catch(() => false)
  } catch {
    return Promise.resolve(false)
  }
}

async function runTests() {
  console.log("🔍 Checking if development server is running...")

  const serverRunning = await checkDevServer()

  if (!serverRunning) {
    console.log("⚠️  Development server not detected at http://localhost:3000")
    console.log("📝 Please start the development server first:")
    console.log("   npm run dev")
    console.log("   # or")
    console.log("   yarn dev")
    console.log("\nThen run this test script again.")
    process.exit(1)
  }

  console.log("✅ Development server is running\n")

  // Install node-fetch if not available
  try {
    require("node-fetch")
  } catch {
    console.log("📦 Installing node-fetch for testing...")
    execSync("npm install node-fetch", { stdio: "inherit" })
  }

  // Run the test suite
  console.log("🚀 Starting test suite...\n")

  try {
    const testScript = path.join(__dirname, "test-unified-services.js")
    execSync(`node ${testScript}`, { stdio: "inherit" })

    console.log("\n✅ All tests completed successfully!")
  } catch (error) {
    console.error("\n❌ Test suite failed:", error.message)
    process.exit(1)
  }
}

// Add health check endpoint for testing
const healthCheckCode = `
// Add this to your app/api/health/route.ts if it doesn't exist
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() })
}
`

console.log("💡 Tip: Make sure you have a health check endpoint at /api/health")
console.log("   You can add this code to app/api/health/route.ts:")
console.log(healthCheckCode)

runTests().catch(console.error)
