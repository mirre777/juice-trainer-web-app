// Test the exact code path from your program conversion service
console.log("🔍 === TESTING ACTUAL CODE PATH ===")

// Import the exact functions from your service
const { Timestamp } = require("firebase/firestore")

// Copy your exact removeUndefinedValues function
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

// Test the exact sequence from your convertAndSendProgram method
console.log("\n📝 Testing exact sequence from convertAndSendProgram")

// Step 1: Create timestamp exactly like your code
const now = Timestamp.now()
console.log("1. Timestamp.now() result:")
console.log("   Value:", now)
console.log("   Type:", typeof now)
console.log("   Constructor:", now.constructor.name)
console.log("   Has seconds:", !!now.seconds)
console.log("   Has nanoseconds:", !!now.nanoseconds)

// Step 2: Create program object exactly like your code
const program = {
  id: "test-program-id",
  name: "Test Program",
  notes: "",
  createdAt: now,
  startedAt: now,
  updatedAt: now,
  duration: 4,
  program_URL: "",
  routines: [],
}

console.log("\n2. Program object before cleaning:")
console.log("   createdAt type:", typeof program.createdAt)
console.log("   createdAt instanceof Timestamp:", program.createdAt instanceof Timestamp)

// Step 3: Apply removeUndefinedValues exactly like your code
const cleanedProgram = removeUndefinedValues(program)

console.log("\n3. Program object after removeUndefinedValues:")
console.log("   createdAt type:", typeof cleanedProgram.createdAt)
console.log("   createdAt instanceof Timestamp:", cleanedProgram.createdAt instanceof Timestamp)
console.log("   createdAt value:", cleanedProgram.createdAt)

// Step 4: Check if any properties are lost
console.log("\n4. Detailed timestamp analysis:")
console.log("   Original timestamp seconds:", now.seconds)
console.log("   Original timestamp nanoseconds:", now.nanoseconds)
console.log("   Cleaned timestamp seconds:", cleanedProgram.createdAt.seconds)
console.log("   Cleaned timestamp nanoseconds:", cleanedProgram.createdAt.nanoseconds)

// Step 5: Test JSON serialization (potential issue)
console.log("\n5. Testing JSON serialization effects:")
try {
  const jsonString = JSON.stringify(cleanedProgram)
  console.log("   JSON.stringify succeeded")

  const parsed = JSON.parse(jsonString)
  console.log("   After JSON round-trip:")
  console.log("   createdAt type:", typeof parsed.createdAt)
  console.log("   createdAt value:", parsed.createdAt)
  console.log("   Lost Timestamp type:", !(parsed.createdAt instanceof Timestamp))
} catch (error) {
  console.log("   JSON serialization failed:", error.message)
}

console.log("\n🎯 === FINAL DIAGNOSIS ===")
if (cleanedProgram.createdAt instanceof Timestamp) {
  console.log("✅ Your removeUndefinedValues function preserves Timestamp objects")
  console.log("🔍 The issue is likely:")
  console.log("   1. JSON serialization somewhere in your API route")
  console.log("   2. Network serialization during Firebase batch operation")
  console.log("   3. Some other transformation not tested here")
  console.log("💡 Solution: Use serverTimestamp() instead of Timestamp.now()")
} else {
  console.log("❌ Your removeUndefinedValues function is converting Timestamps")
  console.log("🔧 This is the source of your problem!")
}
