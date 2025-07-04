#!/usr/bin/env node

const { execSync } = require("child_process")
const path = require("path")

console.log("🧪 Running test suite...")

try {
  // Run Jest tests
  console.log("📋 Running unit tests...")
  execSync("npx jest --passWithNoTests", {
    stdio: "inherit",
    cwd: process.cwd(),
  })

  // Run type checking
  console.log("🔍 Running type checks...")
  execSync("npx tsc --noEmit", {
    stdio: "inherit",
    cwd: process.cwd(),
  })

  // Run linting
  console.log("🔧 Running linter...")
  execSync("npx eslint . --ext .ts,.tsx --max-warnings 0", {
    stdio: "inherit",
    cwd: process.cwd(),
  })

  console.log("✅ All tests passed!")
} catch (error) {
  console.error("❌ Tests failed:", error.message)
  process.exit(1)
}
