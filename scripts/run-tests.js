const { execSync } = require("child_process")

console.log("🚀 Starting Unified Services Migration Tests...\n")

// Test 1: Check if the build passes
console.log("📦 Test 1: Build Test")
try {
  execSync("npm run build", { stdio: "inherit" })
  console.log("✅ Build test passed\n")
} catch (error) {
  console.error("❌ Build test failed")
  console.error(error.message)
  process.exit(1)
}

// Test 2: Check TypeScript compilation
console.log("🔍 Test 2: TypeScript Check")
try {
  execSync("npx tsc --noEmit", { stdio: "inherit" })
  console.log("✅ TypeScript check passed\n")
} catch (error) {
  console.error("❌ TypeScript check failed")
  console.error(error.message)
}

// Test 3: Check for import errors
console.log("🔗 Test 3: Import Validation")
try {
  const fs = require("fs")
  const path = require("path")

  function checkImports(dir) {
    const files = fs.readdirSync(dir)

    for (const file of files) {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory() && !file.startsWith(".") && file !== "node_modules") {
        checkImports(filePath)
      } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
        const content = fs.readFileSync(filePath, "utf8")

        // Check for problematic imports
        if (content.includes("@/firebase/config")) {
          console.error(`❌ Found problematic import in ${filePath}`)
          console.error("   Should use @/lib/firebase/firebase instead")
          return false
        }
      }
    }
    return true
  }

  const isValid = checkImports("./lib") && checkImports("./app") && checkImports("./components")

  if (isValid) {
    console.log("✅ Import validation passed\n")
  } else {
    console.log("❌ Import validation failed\n")
  }
} catch (error) {
  console.error("❌ Import validation error:", error.message)
}

console.log("🎉 Migration tests completed!")
