// Focused script to find the exact timestamp conversion issue
const { Timestamp } = require("firebase/firestore")

console.log("🔍 === FINDING THE EXACT TIMESTAMP ISSUE ===")

// Test your exact removeUndefinedValues function
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

// Test 1: Check if your removeUndefinedValues preserves Timestamps
console.log("\n📝 Test 1: removeUndefinedValues with Timestamp")
const timestamp = Timestamp.now()
console.log("Original Timestamp:", timestamp)
console.log("Type:", typeof timestamp)
console.log("Constructor:", timestamp.constructor.name)

const testObj = {
  createdAt: timestamp,
  name: "test",
  notes: undefined, // This should be removed
}

const cleaned = removeUndefinedValues(testObj)
console.log("\nAfter removeUndefinedValues:")
console.log("createdAt type:", typeof cleaned.createdAt)
console.log("createdAt constructor:", cleaned.createdAt.constructor.name)
console.log("Still Timestamp:", cleaned.createdAt instanceof Timestamp)
console.log("Has notes:", "notes" in cleaned)

// Test 2: Check JSON serialization effects
console.log("\n📝 Test 2: JSON serialization test")
try {
  const jsonString = JSON.stringify(cleaned)
  console.log("JSON string:", jsonString)

  const parsed = JSON.parse(jsonString)
  console.log("After JSON parse:")
  console.log("createdAt type:", typeof parsed.createdAt)
  console.log("createdAt value:", parsed.createdAt)
  console.log("Lost Timestamp:", !(parsed.createdAt instanceof Timestamp))
} catch (error) {
  console.log("JSON error:", error.message)
}

// Test 3: Simulate your exact program creation
console.log("\n📝 Test 3: Your exact program creation flow")

const now = Timestamp.now()
console.log("Step 1 - Create timestamp:")
console.log("now type:", typeof now)
console.log("now instanceof Timestamp:", now instanceof Timestamp)

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

console.log("\nStep 2 - Program object:")
console.log("program.createdAt type:", typeof program.createdAt)
console.log("program.createdAt instanceof Timestamp:", program.createdAt instanceof Timestamp)

const cleanedProgram = removeUndefinedValues(program)
console.log("\nStep 3 - After removeUndefinedValues:")
console.log("cleanedProgram.createdAt type:", typeof cleanedProgram.createdAt)
console.log("cleanedProgram.createdAt instanceof Timestamp:", cleanedProgram.createdAt instanceof Timestamp)

// Test 4: Check what happens with different timestamp types
console.log("\n📝 Test 4: Different timestamp types")

const testCases = {
  timestampNow: Timestamp.now(),
  jsDate: new Date(),
  dateNow: Date.now(), // This is wrong according to Firebase docs
  isoString: new Date().toISOString(), // This is wrong according to Firebase docs
}

Object.entries(testCases).forEach(([name, value]) => {
  console.log(`\n${name}:`)
  console.log("  Value:", value)
  console.log("  Type:", typeof value)
  console.log("  Constructor:", value.constructor?.name || "N/A")

  const cleaned = removeUndefinedValues({ timestamp: value })
  console.log("  After cleaning - type:", typeof cleaned.timestamp)
  console.log("  After cleaning - constructor:", cleaned.timestamp.constructor?.name || "N/A")
})

console.log("\n🎯 === DIAGNOSIS ===")
console.log("Based on Firebase docs, these will work in batch:")
console.log("✅ Timestamp.now()")
console.log("✅ new Date()")
console.log("✅ serverTimestamp()")
console.log("\nThese will NOT work:")
console.log("❌ Date.now() - stores as Number")
console.log("❌ new Date().toISOString() - stores as String")
console.log("❌ JSON.stringify/parse - converts Timestamps to objects")
