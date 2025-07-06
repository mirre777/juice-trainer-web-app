/**
 * Enhanced test script for periodization toggle functionality
 * Tests the conversion logic between periodized and non-periodized programs
 * Includes bidirectional conversion testing
 */

// Mock program data structures for testing
const mockNonPeriodizedProgram = {
  name: "Test Non-Periodized Program",
  description: "A simple program with routines",
  duration_weeks: 1,
  is_periodized: false,
  routines: [
    {
      name: "Upper Body Workout",
      exercises: [
        {
          name: "Bench Press",
          sets: [
            { reps: "8-10", weight: "100kg", rpe: "8", rest: "2min" },
            { reps: "8-10", weight: "100kg", rpe: "8", rest: "2min" },
            { reps: "8-10", weight: "100kg", rpe: "8", rest: "2min" },
          ],
        },
        {
          name: "Pull-ups",
          sets: [
            { reps: "10", weight: "bodyweight", rest: "90s" },
            { reps: "10", weight: "bodyweight", rest: "90s" },
          ],
        },
      ],
    },
    {
      name: "Lower Body Workout",
      exercises: [
        {
          name: "Squats",
          sets: [
            { reps: "12", weight: "80kg", rpe: "7", rest: "2min" },
            { reps: "12", weight: "80kg", rpe: "7", rest: "2min" },
          ],
        },
      ],
    },
  ],
}

const mockPeriodizedProgram = {
  name: "Test Periodized Program",
  description: "A periodized program with different weeks",
  duration_weeks: 3,
  is_periodized: true,
  weeks: [
    {
      week_number: 1,
      routines: [
        {
          name: "Week 1 - Upper Body",
          exercises: [
            {
              name: "Bench Press",
              sets: [{ reps: "12", weight: "80kg", rpe: "6", rest: "90s" }],
            },
          ],
        },
        {
          name: "Week 1 - Lower Body",
          exercises: [
            {
              name: "Squats",
              sets: [{ reps: "15", weight: "70kg", rpe: "6", rest: "90s" }],
            },
          ],
        },
      ],
    },
    {
      week_number: 2,
      routines: [
        {
          name: "Week 2 - Upper Body",
          exercises: [
            {
              name: "Bench Press",
              sets: [{ reps: "10", weight: "90kg", rpe: "7", rest: "2min" }],
            },
          ],
        },
        {
          name: "Week 2 - Lower Body",
          exercises: [
            {
              name: "Squats",
              sets: [{ reps: "12", weight: "80kg", rpe: "7", rest: "2min" }],
            },
          ],
        },
      ],
    },
    {
      week_number: 3,
      routines: [
        {
          name: "Week 3 - Upper Body",
          exercises: [
            {
              name: "Bench Press",
              sets: [{ reps: "8", weight: "100kg", rpe: "8", rest: "2min" }],
            },
          ],
        },
        {
          name: "Week 3 - Lower Body",
          exercises: [
            {
              name: "Squats",
              sets: [{ reps: "10", weight: "90kg", rpe: "8", rest: "2min" }],
            },
          ],
        },
      ],
    },
  ],
}

// Conversion functions (mirroring the component logic)
function convertToPeriodicized(program, numberOfWeeks) {
  console.log(`\n🔄 Converting "${program.name}" to periodized (${numberOfWeeks} weeks)`)

  if (program.is_periodized) {
    console.log("❌ Program is already periodized!")
    return { success: false, program, error: "Already periodized" }
  }

  const baseRoutines = program.routines || []

  if (baseRoutines.length === 0) {
    console.log("❌ No routines found to convert!")
    return { success: false, program, error: "No routines found" }
  }

  const weeks = []

  for (let weekNum = 1; weekNum <= numberOfWeeks; weekNum++) {
    weeks.push({
      week_number: weekNum,
      routines: baseRoutines.map((routine, index) => ({
        ...routine,
        name: `${routine.name || routine.title || `Routine ${index + 1}`} - Week ${weekNum}`,
      })),
    })
  }

  const convertedProgram = {
    ...program,
    is_periodized: true,
    weeks,
    routines: undefined,
    duration_weeks: numberOfWeeks,
  }

  console.log("✅ Conversion successful!")
  console.log(`   - Created ${weeks.length} weeks`)
  console.log(`   - Each week has ${weeks[0].routines.length} routines`)
  console.log(`   - Week 1 routines: ${weeks[0].routines.map((r) => r.name).join(", ")}`)
  console.log(`   - Week ${numberOfWeeks} routines: ${weeks[numberOfWeeks - 1].routines.map((r) => r.name).join(", ")}`)

  return { success: true, program: convertedProgram }
}

function convertToNonPeriodized(program, selectedWeekToKeep) {
  console.log(`\n🔄 Converting "${program.name}" to non-periodized (keeping week ${selectedWeekToKeep})`)

  if (!program.is_periodized) {
    console.log("❌ Program is already non-periodized!")
    return { success: false, program, error: "Already non-periodized" }
  }

  const selectedWeek = program.weeks?.find((w) => w.week_number === selectedWeekToKeep)
  const routinesToKeep = selectedWeek?.routines || []

  if (routinesToKeep.length === 0) {
    console.log(`❌ No routines found in week ${selectedWeekToKeep}`)
    return { success: false, program, error: `No routines in week ${selectedWeekToKeep}` }
  }

  // Remove week suffixes from routine names
  const cleanedRoutines = routinesToKeep.map((routine) => ({
    ...routine,
    name: routine.name?.replace(/ - Week \d+$/, "") || routine.name,
  }))

  const convertedProgram = {
    ...program,
    is_periodized: false,
    routines: cleanedRoutines,
    weeks: undefined,
    duration_weeks: 1,
  }

  console.log("✅ Conversion successful!")
  console.log(`   - Kept ${cleanedRoutines.length} routines from week ${selectedWeekToKeep}`)
  console.log(`   - Routine names: ${cleanedRoutines.map((r) => r.name).join(", ")}`)

  return { success: true, program: convertedProgram }
}

function testAvailableFieldsAnalysis(program) {
  console.log(`\n🔍 Analyzing available fields in "${program.name}"`)

  const currentRoutines = program.weeks && program.weeks.length > 0 ? program.weeks[0].routines : program.routines || []

  let hasReps = false
  let hasWeight = false
  let hasRpe = false
  let hasRest = false
  let hasNotes = false

  // Check all exercises and sets to see what fields exist
  for (const routine of currentRoutines) {
    for (const exercise of routine.exercises || []) {
      for (const set of exercise.sets || []) {
        if (set.reps !== undefined && set.reps !== null && set.reps !== "") hasReps = true
        if (set.weight !== undefined && set.weight !== null && set.weight !== "") hasWeight = true
        if (set.rpe !== undefined && set.rpe !== null && set.rpe !== "") hasRpe = true
        if (set.rest !== undefined && set.rest !== null && set.rest !== "") hasRest = true
        if (set.notes !== undefined && set.notes !== null && set.notes !== "") hasNotes = true
      }
    }
  }

  const availableFields = { hasReps, hasWeight, hasRpe, hasRest, hasNotes }
  const fieldCount = Object.values(availableFields).filter(Boolean).length

  console.log(`   - Available fields: ${JSON.stringify(availableFields)}`)
  console.log(`   - Total field types: ${fieldCount}`)

  return availableFields
}

function testBidirectionalConversion() {
  console.log("\n🔄 BIDIRECTIONAL CONVERSION TEST")
  console.log("=================================")

  // Test 1: Non-Periodized → Periodized → Non-Periodized
  console.log("\n📋 TEST 1: Non-Periodized → Periodized → Non-Periodized")

  let currentProgram = JSON.parse(JSON.stringify(mockNonPeriodizedProgram)) // Deep clone
  console.log(`Starting with: "${currentProgram.name}" (is_periodized: ${currentProgram.is_periodized})`)

  // Step 1: Convert to periodized
  const step1 = convertToPeriodicized(currentProgram, 4)
  if (!step1.success) {
    console.log("❌ Step 1 failed:", step1.error)
    return false
  }
  currentProgram = step1.program

  // Step 2: Convert back to non-periodized
  const step2 = convertToNonPeriodized(currentProgram, 2)
  if (!step2.success) {
    console.log("❌ Step 2 failed:", step2.error)
    return false
  }
  currentProgram = step2.program

  console.log(`✅ Final result: "${currentProgram.name}" (is_periodized: ${currentProgram.is_periodized})`)
  console.log(`   - Final routines: ${currentProgram.routines?.map((r) => r.name).join(", ") || "None"}`)

  // Test 2: Periodized → Non-Periodized → Periodized
  console.log("\n📋 TEST 2: Periodized → Non-Periodized → Periodized")

  currentProgram = JSON.parse(JSON.stringify(mockPeriodizedProgram)) // Deep clone
  console.log(`Starting with: "${currentProgram.name}" (is_periodized: ${currentProgram.is_periodized})`)

  // Step 1: Convert to non-periodized
  const step3 = convertToNonPeriodized(currentProgram, 2)
  if (!step3.success) {
    console.log("❌ Step 3 failed:", step3.error)
    return false
  }
  currentProgram = step3.program

  // Step 2: Convert back to periodized
  const step4 = convertToPeriodicized(currentProgram, 6)
  if (!step4.success) {
    console.log("❌ Step 4 failed:", step4.error)
    return false
  }
  currentProgram = step4.program

  console.log(`✅ Final result: "${currentProgram.name}" (is_periodized: ${currentProgram.is_periodized})`)
  console.log(`   - Final weeks: ${currentProgram.weeks?.length || 0}`)
  console.log(`   - Week 1 routines: ${currentProgram.weeks?.[0]?.routines?.map((r) => r.name).join(", ") || "None"}`)

  return true
}

function testEdgeCases() {
  console.log("\n⚠️  EDGE CASES TEST")
  console.log("==================")

  // Test empty program
  const emptyProgram = { name: "Empty Program", routines: [], is_periodized: false }
  console.log("\n🧪 Testing empty program conversion:")
  const emptyResult = convertToPeriodicized(emptyProgram, 4)
  console.log(`   Result: ${emptyResult.success ? "✅ Success" : "❌ Failed - " + emptyResult.error}`)

  // Test program with no sets
  const noSetsProgram = {
    name: "No Sets Program",
    is_periodized: false,
    routines: [
      {
        name: "Empty Routine",
        exercises: [
          {
            name: "Exercise with no sets",
            sets: [],
          },
        ],
      },
    ],
  }
  console.log("\n🧪 Testing program with no sets:")
  testAvailableFieldsAnalysis(noSetsProgram)

  // Test invalid week selection
  const invalidWeekTest = convertToNonPeriodized(mockPeriodizedProgram, 99)
  console.log("\n🧪 Testing invalid week selection:")
  console.log(`   Result: ${invalidWeekTest.success ? "✅ Success" : "❌ Failed - " + invalidWeekTest.error}`)

  // Test conversion with 0 weeks
  const zeroWeeksTest = convertToPeriodicized(mockNonPeriodizedProgram, 0)
  console.log("\n🧪 Testing conversion with 0 weeks:")
  console.log(`   Result: ${zeroWeeksTest.success ? "✅ Success" : "❌ Failed - " + zeroWeeksTest.error}`)
}

function validateProgramStructure(program, expectedType) {
  console.log(`\n🔍 Validating program structure (expected: ${expectedType})`)

  const issues = []

  if (expectedType === "periodized") {
    if (!program.is_periodized) issues.push("is_periodized should be true")
    if (!program.weeks || program.weeks.length === 0) issues.push("weeks array should exist and not be empty")
    if (program.routines !== undefined) issues.push("routines should be undefined for periodized programs")

    // Check week structure
    if (program.weeks) {
      for (const week of program.weeks) {
        if (!week.week_number) issues.push(`Week missing week_number: ${JSON.stringify(week)}`)
        if (!week.routines || !Array.isArray(week.routines))
          issues.push(`Week ${week.week_number} missing routines array`)
      }
    }
  } else if (expectedType === "non-periodized") {
    if (program.is_periodized) issues.push("is_periodized should be false")
    if (!program.routines || program.routines.length === 0) issues.push("routines array should exist and not be empty")
    if (program.weeks !== undefined) issues.push("weeks should be undefined for non-periodized programs")
  }

  if (issues.length === 0) {
    console.log("✅ Program structure is valid")
    return true
  } else {
    console.log("❌ Program structure issues found:")
    issues.forEach((issue) => console.log(`   - ${issue}`))
    return false
  }
}

function runComprehensiveTests() {
  console.log("🚀 COMPREHENSIVE PERIODIZATION TOGGLE TESTS")
  console.log("===========================================")

  let allTestsPassed = true

  // Test 1: Basic conversions
  console.log("\n📋 BASIC CONVERSION TESTS")
  const basicTest1 = convertToPeriodicized(mockNonPeriodizedProgram, 4)
  if (basicTest1.success) {
    allTestsPassed &= validateProgramStructure(basicTest1.program, "periodized")
  } else {
    allTestsPassed = false
  }

  const basicTest2 = convertToNonPeriodized(mockPeriodizedProgram, 2)
  if (basicTest2.success) {
    allTestsPassed &= validateProgramStructure(basicTest2.program, "non-periodized")
  } else {
    allTestsPassed = false
  }

  // Test 2: Bidirectional conversion
  console.log("\n📋 BIDIRECTIONAL CONVERSION TESTS")
  allTestsPassed &= testBidirectionalConversion()

  // Test 3: Available fields analysis
  console.log("\n📋 AVAILABLE FIELDS ANALYSIS TESTS")
  testAvailableFieldsAnalysis(mockNonPeriodizedProgram)
  testAvailableFieldsAnalysis(mockPeriodizedProgram)

  // Test 4: Edge cases
  testEdgeCases()

  // Test 5: Data integrity check
  console.log("\n📋 DATA INTEGRITY TESTS")
  const integrityTest = convertToPeriodicized(mockNonPeriodizedProgram, 3)
  if (integrityTest.success) {
    const originalExerciseCount = mockNonPeriodizedProgram.routines.reduce(
      (total, routine) => total + (routine.exercises?.length || 0),
      0,
    )
    const convertedExerciseCount = integrityTest.program.weeks[0].routines.reduce(
      (total, routine) => total + (routine.exercises?.length || 0),
      0,
    )

    console.log(`   - Original exercise count: ${originalExerciseCount}`)
    console.log(`   - Converted exercise count per week: ${convertedExerciseCount}`)

    if (originalExerciseCount === convertedExerciseCount) {
      console.log("✅ Exercise count preserved during conversion")
    } else {
      console.log("❌ Exercise count mismatch during conversion")
      allTestsPassed = false
    }
  }

  console.log("\n" + "=".repeat(50))
  if (allTestsPassed) {
    console.log("🎉 ALL TESTS PASSED! Periodization toggle is working correctly.")
  } else {
    console.log("❌ SOME TESTS FAILED! Please review the issues above.")
  }
  console.log("=".repeat(50))

  return allTestsPassed
}

// Run all tests
runComprehensiveTests()
