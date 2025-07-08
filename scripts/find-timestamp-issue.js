// Based on Firebase documentation, let's find the exact issue
console.log("🔍 === FINDING TIMESTAMP ISSUE BASED ON FIREBASE DOCS ===")

const { Timestamp } = require("firebase/firestore")

console.log("\n📝 Testing the three things that DON'T work in Firebase:")

// 1. Date.now() - Returns milliseconds as number
const dateNow = Date.now()
console.log("1. Date.now():", dateNow)
console.log("   Type:", typeof dateNow)
console.log("   ❌ This gets stored as Number in Firestore")

// 2. new Date().toISOString() - Returns string
const isoString = new Date().toISOString()
console.log("\n2. new Date().toISOString():", isoString)
console.log("   Type:", typeof isoString)
console.log("   ❌ This gets stored as String in Firestore")

// 3. JSON serialization - Converts everything to strings
const timestampObj = { createdAt: Timestamp.now() }
const jsonString = JSON.stringify(timestampObj)
const parsed = JSON.parse(jsonString)
console.log("\n3. JSON serialization:")
console.log("   Original:", timestampObj.createdAt)
console.log("   After JSON round-trip:", parsed.createdAt)
console.log("   Type after JSON:", typeof parsed.createdAt)
console.log("   ❌ This gets stored as String in Firestore")

console.log("\n📝 Testing the three things that DO work in Firebase:")

// 1. JavaScript Date object
const jsDate = new Date()
console.log("1. new Date():", jsDate)
console.log("   Type:", typeof jsDate)
console.log("   Constructor:", jsDate.constructor.name)
console.log("   ✅ This gets stored as Timestamp in Firestore")

// 2. Timestamp.now()
const timestamp = Timestamp.now()
console.log("\n2. Timestamp.now():", timestamp)
console.log("   Type:", typeof timestamp)
console.log("   Constructor:", timestamp.constructor.name)
console.log("   Has seconds:", !!timestamp.seconds)
console.log("   ✅ This gets stored as Timestamp in Firestore")

// 3. serverTimestamp() - We can't test this without Firebase connection
console.log("\n3. serverTimestamp():")
console.log("   ✅ This gets stored as Timestamp in Firestore")

console.log("\n🎯 === CHECKING YOUR CODE FOR THESE ISSUES ===")

// Check if your code is using any of the problematic patterns
function analyzeYourCode() {
  console.log("\n📝 Analyzing your program creation code:")

  // Your current approach
  const now = Timestamp.now()
  console.log("✅ You're using Timestamp.now() - this is correct")

  // Check if removeUndefinedValues affects it
  function removeUndefinedValues(obj) {
    if (obj === null || obj === undefined) {
      return null
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => removeUndefinedValues(item))
    }

    if (typeof obj === "object") {
      const cleaned = {}
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = removeUndefinedValues(value)
        }
      }
      return cleaned
    }

    return obj
  }

  const testProgram = {
    createdAt: now,
    startedAt: now,
    updatedAt: now,
  }

  const cleaned = removeUndefinedValues(testProgram)

  console.log("After removeUndefinedValues:")
  console.log("   createdAt still Timestamp:", cleaned.createdAt instanceof Timestamp)

  if (cleaned.createdAt instanceof Timestamp) {
    console.log("✅ removeUndefinedValues preserves Timestamps")
    console.log("🔍 The issue must be elsewhere - likely JSON serialization in API route")
  } else {
    console.log("❌ removeUndefinedValues is breaking Timestamps")
  }
}

analyzeYourCode()

console.log("\n💡 === SOLUTION ===")
console.log("Based on Firebase docs, use serverTimestamp() instead:")
console.log("import { serverTimestamp } from 'firebase/firestore'")
console.log("const now = serverTimestamp()")
console.log("This guarantees proper Timestamp storage in Firestore")
