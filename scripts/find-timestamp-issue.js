console.log("=== COMPARING CLIENT vs PROGRAM TIMESTAMP CREATION ===\n")

// Simulate the client creation approach
console.log("1. CLIENT CREATION APPROACH:")
console.log("   - Uses: addDoc() directly")
console.log("   - Timestamp method: serverTimestamp()")
console.log("   - Code pattern:")
console.log(`   const newClient = {
     ...clientData,
     createdAt: serverTimestamp(),
     updatedAt: serverTimestamp(),
   }
   await addDoc(clientsRef, newClient)`)

console.log("\n" + "=".repeat(50) + "\n")

// Simulate the program creation approach
console.log("2. PROGRAM CREATION APPROACH:")
console.log("   - Uses: writeBatch()")
console.log("   - Timestamp method: Timestamp.now()")
console.log("   - Code pattern:")
console.log(`   const now = Timestamp.now()
   const program = {
     id: programId,
     name: "Program Name",
     createdAt: now,
     startedAt: now,
     updatedAt: now,
   }
   batch.set(programDocRef, program)
   await batch.commit()`)

console.log("\n" + "=".repeat(50) + "\n")

// Test timestamp types
console.log("3. TIMESTAMP TYPE ANALYSIS:")

// Test what serverTimestamp() returns
console.log("serverTimestamp() returns:")
try {
  // This would need Firebase import to work properly
  console.log("   - Type: Special sentinel value")
  console.log("   - Purpose: Server-side timestamp generation")
  console.log("   - Works with: addDoc(), setDoc(), updateDoc(), writeBatch()")
} catch (e) {
  console.log("   - Cannot test without Firebase connection")
}

console.log("\nTimestamp.now() returns:")
try {
  // This would need Firebase import to work properly
  console.log("   - Type: Timestamp instance")
  console.log("   - Purpose: Client-side timestamp generation")
  console.log("   - Has properties: seconds, nanoseconds")
} catch (e) {
  console.log("   - Cannot test without Firebase connection")
}

console.log("\n" + "=".repeat(50) + "\n")

console.log("4. POTENTIAL ISSUE ANALYSIS:")
console.log("✅ Client creation: Uses serverTimestamp() → Works correctly")
console.log("❌ Program creation: Uses Timestamp.now() → May cause issues")
console.log("\nPOSSIBLE CAUSES:")
console.log("1. Timestamp.now() creates client-side timestamp")
console.log("2. WriteBatch may serialize Timestamp.now() differently")
console.log("3. The removeUndefinedValues() function may affect Timestamp objects")

console.log("\n" + "=".repeat(50) + "\n")

console.log("5. RECOMMENDED FIX:")
console.log("Change program creation to use serverTimestamp() like client creation:")
console.log(`   const program = {
     id: programId,
     name: programData.name,
     createdAt: serverTimestamp(),
     startedAt: serverTimestamp(), 
     updatedAt: serverTimestamp(),
   }`)

console.log("\nThis ensures consistent timestamp handling across your app!")
