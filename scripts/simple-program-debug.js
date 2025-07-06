// Simple debug script to compare program structures
console.log("=== PROGRAM STRUCTURE COMPARISON ===")

// Working program structure (from user 8oga)
const workingProgram = {
  createdAt: "Firestore Timestamp",
  duration: "Number",
  id: "String",
  name: "String",
  notes: "Empty string",
  program_URL: "Empty string",
  routines: "Array of {order, routineId, week}",
  startedAt: "Firestore Timestamp",
  updatedAt: "Firestore Timestamp", // Note: updatedAt not updated_at
}

// Your program structure
const yourProgram = {
  createdAt: "ISO String ❌",
  duration: "Number ✅",
  id: "String ✅",
  isActive: "Boolean ❌ (extra field)",
  name: "String ✅",
  notes: "Empty string ✅",
  program_URL: "Empty string ✅",
  routines: "Array ✅",
  startedAt: "ISO String ❌",
  status: "String ❌ (extra field)",
  updated_at: "ISO String ❌ (wrong field name and type)",
}

console.log("Working program fields:", Object.keys(workingProgram))
console.log("Your program fields:", Object.keys(yourProgram))

console.log("\n🎯 The main issue is TIMESTAMP FORMAT and FIELD NAMING")
console.log("Working program timestamps are Firestore Timestamp objects")
console.log("Your program timestamps are ISO strings")
console.log("Working program uses 'updatedAt', yours uses 'updated_at'")
