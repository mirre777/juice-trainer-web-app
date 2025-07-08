// Script to fix the existing program structure based on working program from user 8oga
console.log("=== FIXING EXISTING PROGRAM BASED ON WORKING STRUCTURE ===")

const workingProgramStructure = {
  createdAt: "Firestore Timestamp (displays as: June 23, 2025 at 1:08:40 PM UTC+2)",
  duration: 2, // Number
  id: "5f476169-7a08-4d4a-a9db-f6dbbe30d312",
  name: "5x Upper/Lower/Full - Base Building Phase, TC1",
  notes: "", // Empty string
  program_URL: "", // KEEP THIS FIELD - it exists in working program
  routines: [
    { order: 1, routineId: "577...", week: 1 },
    { order: 2, routineId: "b16...", week: 1 },
    { order: 1, routineId: "9f8...", week: 2 },
    { order: 2, routineId: "6857...", week: 2 },
  ],
  startedAt: "Firestore Timestamp (displays as: June 23, 2025 at 1:08:40 PM UTC+2)",
  updatedAt: "Firestore Timestamp (displays as: June 23, 2025 at 1:08:40 PM UTC+2)", // Note: updatedAt, not updated_at
}

const yourProgramStructure = {
  createdAt: "2025-07-06T11:45:31.548Z", // ISO STRING - WRONG!
  duration: 4,
  id: "473a9142-36ed-42f1-823e-381fb27cbed1",
  isActive: true, // EXTRA FIELD - REMOVE
  name: "Sample Workout Program",
  notes: "", // Correct
  program_URL: "", // Correct - keep this
  routines: [
    { order: 1, routineId: "a1be...", week: 1 },
    { order: 2, routineId: "84ce...", week: 1 },
  ],
  startedAt: "2025-07-06T11:45:31.548Z", // ISO STRING - WRONG!
  status: "active", // EXTRA FIELD - REMOVE
  updated_at: "2025-07-06T11:45:31.548Z", // WRONG FIELD NAME - should be updatedAt
}

console.log("\n🔍 KEY DIFFERENCES FOUND:")
console.log("1. ❌ Timestamps: Yours are ISO strings, working program uses Firestore Timestamps")
console.log("2. ❌ Field name: You have 'updated_at', working program has 'updatedAt'")
console.log("3. ❌ Extra fields: You have 'isActive' and 'status', working program doesn't")
console.log("4. ✅ program_URL: Both have this field (I was wrong to remove it)")
console.log("5. ✅ notes: Both use empty string")

console.log("\n🛠️ FIXES NEEDED:")
console.log("1. Convert ISO string timestamps to Firestore Timestamp objects")
console.log("2. Rename 'updated_at' to 'updatedAt'")
console.log("3. Remove 'isActive' and 'status' fields")
console.log("4. Keep 'program_URL' field")
