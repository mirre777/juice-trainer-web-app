// Simple debug script to check program structure
console.log("=== PROGRAM DEBUG ANALYSIS ===")

// Mock data based on what we see in Firebase
const currentProgram = {
  id: "473a9142-36ed-42f1-823e-381fb27cbed1",
  name: "Sample Workout Program",
  duration: 4,
  notes: "",
  createdAt: "2025-07-06T11:45:31.548Z", // ❌ This is an ISO string
  startedAt: "2025-07-06T11:45:31.548Z", // ❌ This is an ISO string
  updated_at: "2025-07-06T11:45:31.548Z", // ❌ This is an ISO string
  program_URL: "", // ❌ Extra field
  isActive: true, // ❌ Extra field
  status: "active", // ❌ Extra field
  routines: [
    { routineId: "g1be4875-001a-4d4a-8d9b-d0333e4a141a", week: 1, order: 1 },
    { routineId: "84ce19d9-2776-42ba-94b1-50059dbdc267", week: 1, order: 2 },
  ],
}

const workingProgram = {
  id: "some-working-id",
  name: "Working Program",
  duration: 4,
  notes: "",
  createdAt: "Timestamp object", // ✅ Firestore Timestamp
  startedAt: "Timestamp object", // ✅ Firestore Timestamp
  updated_at: "Timestamp object", // ✅ Firestore Timestamp
  // No extra fields
  routines: [
    { routineId: "routine-1", week: 1, order: 1 },
    { routineId: "routine-2", week: 1, order: 2 },
  ],
}

console.log("🔍 ISSUES FOUND:")
console.log("1. Timestamps are ISO strings instead of Firestore Timestamp objects")
console.log("2. Extra fields present: program_URL, isActive, status")
console.log("3. Mobile app likely filters out programs with wrong timestamp types")

console.log("\n✅ SOLUTION:")
console.log("Use the updated program conversion service that:")
console.log("- Creates Timestamp objects with Timestamp.now()")
console.log("- Removes extra fields")
console.log("- Ensures proper data types")

console.log("\n🚀 NEXT STEPS:")
console.log("1. Test the updated service in preview environment")
console.log("2. Create a new program assignment")
console.log("3. Check if it appears in mobile app")
