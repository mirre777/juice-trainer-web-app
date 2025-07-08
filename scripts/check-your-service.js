// Check your actual program conversion service for timestamp issues
console.log("🔍 === CHECKING PROGRAM CONVERSION SERVICE ===")

// Simulate your service's timestamp creation
const { Timestamp } = require("firebase/firestore")

function simulateYourService() {
  console.log("\n📝 Simulating your convertAndSendProgram method")

  // This is exactly what your service does
  const now = Timestamp.now()
  console.log("1. Created timestamp:", now)
  console.log("   Type:", typeof now)
  console.log("   Constructor:", now.constructor.name)

  // Your program object creation
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

  console.log("\n2. Program object created:")
  console.log("   createdAt type:", typeof program.createdAt)
  console.log("   createdAt constructor:", program.createdAt.constructor.name)

  // Your removeUndefinedValues function
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

  const cleanedProgram = removeUndefinedValues(program)
  console.log("\n3. After removeUndefinedValues:")
  console.log("   createdAt type:", typeof cleanedProgram.createdAt)
  console.log("   createdAt constructor:", cleanedProgram.createdAt.constructor.name)
  console.log("   Still Timestamp:", cleanedProgram.createdAt instanceof Timestamp)

  // Check if there are any other transformations
  console.log("\n4. Final object structure:")
  console.log("   createdAt value:", cleanedProgram.createdAt)
  console.log("   Has seconds property:", !!cleanedProgram.createdAt.seconds)
  console.log("   Has nanoseconds property:", !!cleanedProgram.createdAt.nanoseconds)

  return cleanedProgram
}

const result = simulateYourService()

console.log("\n🎯 === DIAGNOSIS ===")
if (result.createdAt instanceof Timestamp) {
  console.log("✅ Timestamps are preserved in your service logic")
  console.log("🔍 The issue is likely in the Firebase batch.set() operation or network serialization")
  console.log("💡 Try using serverTimestamp() instead of Timestamp.now()")
} else {
  console.log("❌ Timestamps are being converted in your service logic")
  console.log("🔍 Check the removeUndefinedValues function or other transformations")
}
