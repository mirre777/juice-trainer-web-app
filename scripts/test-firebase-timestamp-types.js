// Test what Firebase actually accepts as valid timestamps
const { Timestamp, serverTimestamp } = require("firebase/firestore")

console.log("🔍 === TESTING FIREBASE TIMESTAMP TYPES ===")

// According to Firebase docs, these are the ONLY valid timestamp types:
const validTimestamps = {
  "Timestamp.now()": Timestamp.now(),
  "new Date()": new Date(),
  "serverTimestamp()": serverTimestamp(),
}

const invalidTimestamps = {
  "Date.now()": Date.now(),
  "new Date().toISOString()": new Date().toISOString(),
  "JSON parsed timestamp": JSON.parse(JSON.stringify({ ts: Timestamp.now() })).ts,
}

console.log("\n✅ VALID timestamp types for Firebase:")
Object.entries(validTimestamps).forEach(([name, value]) => {
  console.log(`\n${name}:`)
  console.log("  Value:", value)
  console.log("  Type:", typeof value)
  console.log("  Constructor:", value.constructor?.name || "N/A")
  if (value && typeof value === "object" && "seconds" in value) {
    console.log("  Has seconds:", !!value.seconds)
  }
})

console.log("\n❌ INVALID timestamp types for Firebase:")
Object.entries(invalidTimestamps).forEach(([name, value]) => {
  console.log(`\n${name}:`)
  console.log("  Value:", value)
  console.log("  Type:", typeof value)
  console.log("  Constructor:", value.constructor?.name || "N/A")
  console.log(
    "  Will store as:",
    typeof value === "number" ? "Number" : typeof value === "string" ? "String" : "Object",
  )
})

console.log("\n🎯 === RECOMMENDATION ===")
console.log("Your current code uses Timestamp.now() which is CORRECT")
console.log("The issue must be one of these:")
console.log("1. JSON serialization somewhere in your API route")
console.log("2. Some other transformation converting Timestamps to plain objects")
console.log("3. Network serialization (less likely)")
console.log("\n💡 SOLUTION: Use serverTimestamp() instead of Timestamp.now()")
console.log("serverTimestamp() is evaluated on the server, avoiding client-side serialization issues")
