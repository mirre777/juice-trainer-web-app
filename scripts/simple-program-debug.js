// Simple debug script to check program structure
const admin = require("firebase-admin")

// You'll need to initialize with your service account key
// For now, this shows the structure we should check

async function checkProgramStructure() {
  console.log("=== PROGRAM STRUCTURE DEBUG ===")

  // Key things to check based on common mobile app issues:
  console.log("\n1. TIMESTAMP FORMAT:")
  console.log("   ✓ Should be Firestore Timestamp objects, not ISO strings")
  console.log('   ✗ Your program has: "2025-07-06T11:45:31.548Z" (ISO string)')
  console.log("   ✓ Should be: Firestore Timestamp object")

  console.log("\n2. FIELD TYPES:")
  console.log("   ✓ duration: number (you have: 4)")
  console.log("   ✓ routines[].week: number (you have: 1)")
  console.log("   ✓ routines[].order: number (you have: 1, 2)")
  console.log('   ✓ notes: string (you have: "")')

  console.log("\n3. REQUIRED FIELDS:")
  console.log("   ✓ id: string")
  console.log("   ✓ name: string")
  console.log("   ✓ duration: number")
  console.log("   ✓ routines: array")
  console.log("   ✓ createdAt: Timestamp")
  console.log("   ✓ startedAt: Timestamp")
  console.log("   ✓ updated_at: Timestamp")
  console.log("   ✓ notes: string")

  console.log("\n4. POTENTIAL ISSUES:")
  console.log("   🔴 MAIN ISSUE: Timestamp format is wrong")
  console.log("   🔴 Extra fields might cause filtering issues")
  console.log("   🟡 Check if routines exist and are valid")

  console.log("\n5. RECOMMENDED FIXES:")
  console.log("   1. Convert timestamps to Firestore Timestamp objects")
  console.log("   2. Remove extra fields (program_URL, isActive, status)")
  console.log("   3. Ensure all routines exist in the routines collection")
  console.log("   4. Verify mobile app filtering logic")
}

checkProgramStructure()
