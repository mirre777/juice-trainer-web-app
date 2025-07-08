// Simple Node.js script to test timestamp behavior without Firebase connection
const { Timestamp } = require("firebase/firestore")

console.log("🔍 === TIMESTAMP BEHAVIOR ANALYSIS ===")

// Test 1: Create different timestamp types
console.log("\n📝 Test 1: Different timestamp creation methods")

const timestampNow = Timestamp.now()
const jsDate = new Date()
const dateNow = Date.now()
const isoString = new Date().toISOString()

console.log("Timestamp.now():", timestampNow)
console.log("Type:", typeof timestampNow)
console.log("Constructor:", timestampNow.constructor.name)
console.log("Has seconds:", !!timestampNow.seconds)
console.log("Has nanoseconds:", !!timestampNow.nanoseconds)

console.log("\nJavaScript Date:", jsDate)
console.log("Type:", typeof jsDate)
console.log("Constructor:", jsDate.constructor.name)

console.log("\nDate.now():", dateNow)
console.log("Type:", typeof dateNow)

console.log("\nISO String:", isoString)
console.log("Type:", typeof isoString)

// Test 2: JSON serialization effects (common gotcha)
console.log("\n📝 Test 2: JSON serialization effects")

const objectWithTimestamp = {
  id: "test",
  createdAt: timestampNow,
  startedAt: jsDate,
  updatedAt: dateNow,
}

console.log("Original object:")
console.log("createdAt type:", typeof objectWithTimestamp.createdAt)
console.log("startedAt type:", typeof objectWithTimestamp.startedAt)
console.log("updatedAt type:", typeof objectWithTimestamp.updatedAt)

// Simulate JSON.stringify (common mistake)
const jsonString = JSON.stringify(objectWithTimestamp)
console.log("\nAfter JSON.stringify:", jsonString)

const parsed = JSON.parse(jsonString)
console.log("\nAfter JSON.parse:")
console.log("createdAt:", parsed.createdAt)
console.log("createdAt type:", typeof parsed.createdAt)
console.log("startedAt:", parsed.startedAt)
console.log("startedAt type:", typeof parsed.startedAt)
console.log("Lost Timestamp type:", !(parsed.createdAt instanceof Timestamp))

// Test 3: removeUndefinedValues function effect
console.log("\n📝 Test 3: removeUndefinedValues function effect")

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

const testObject = {
  id: "test",
  createdAt: Timestamp.now(),
  startedAt: new Date(),
  notes: undefined,
  duration: 4,
}

console.log("Before removeUndefinedValues:")
console.log("createdAt type:", typeof testObject.createdAt)
console.log("createdAt constructor:", testObject.createdAt.constructor.name)

const cleaned = removeUndefinedValues(testObject)
console.log("\nAfter removeUndefinedValues:")
console.log("createdAt type:", typeof cleaned.createdAt)
console.log("createdAt constructor:", cleaned.createdAt.constructor.name)
console.log("Still Timestamp instance:", cleaned.createdAt instanceof Timestamp)

// Test 4: Simulate your exact program creation
console.log("\n📝 Test 4: Simulating your exact program creation")

const now = Timestamp.now()
console.log("Initial timestamp:", now)
console.log("Initial type:", typeof now)

const program = {
  id: "test-program",
  name: "Test Program",
  notes: "",
  createdAt: now,
  startedAt: now,
  updatedAt: now,
  duration: 4,
  program_URL: "",
  routines: [],
}

console.log("\nProgram object:")
console.log("createdAt type:", typeof program.createdAt)
console.log("createdAt constructor:", program.createdAt.constructor.name)

const cleanedProgram = removeUndefinedValues(program)
console.log("\nAfter cleaning:")
console.log("createdAt type:", typeof cleanedProgram.createdAt)
console.log("createdAt constructor:", cleanedProgram.createdAt.constructor.name)
console.log("Still Timestamp:", cleanedProgram.createdAt instanceof Timestamp)

console.log("\n🎯 === ANALYSIS COMPLETE ===")
console.log("✅ If timestamps maintain their type through all steps, the issue is in Firebase communication")
console.log("❌ If timestamps lose their type, we found the conversion point")
