// Script to fix the existing program structure
console.log("=== FIXING EXISTING PROGRAM ===")

// This would be the API call you need to make to fix the program
const fixProgramData = {
  userId: "HN2QjNvnWKQ37nVXCSkhXdCwMEH2",
  programId: "473a9142-36ed-42f1-823e-381fb27cbed1",
}

console.log("To fix your existing program, make this API call:")
console.log("POST /api/programs/fix-structure")
console.log("Body:", JSON.stringify(fixProgramData, null, 2))

console.log("\nOr create a new program with the corrected structure using:")
console.log("POST /api/programs/send-to-client")
console.log("This will use the updated conversion service with proper Timestamp objects")

console.log("\n✅ Key fixes applied in the updated service:")
console.log("1. Uses Timestamp.now() instead of ISO strings")
console.log("2. Removes extra fields (program_URL, isActive, status)")
console.log("3. Ensures notes is always empty string, never null")
console.log("4. Validates all numeric fields are properly typed")
console.log("5. Includes validation and fix functions")
