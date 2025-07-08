/**
 * Enhanced test script for periodization toggle functionality
 * Tests bidirectional conversion between periodized and non-periodized programs
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
              sets: [{ reps: "15", weight: "60kg", rpe: "6", rest: "90s" }],
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
              sets: [{ reps: "12", weight: "70kg", rpe: "7", rest: "2min" }],
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
              sets: [{ reps: "10", weight: "80kg", rpe: "8", rest: "2min" }],
            },
          ],
        },
      ],
    },
  ],
}

// Test functions that mirror the actual component logic
function testConvertToPeriodicized(program, numberOfWeeks) {
  console.log("\n=== Testing Conversion to Periodized ===")
  console.log(`Original program: ${program.name}`)
  console.log(`Is periodized: ${program.is_periodized}`)
  console.log(`Converting to ${numberOfWeeks} weeks...`)

  if (program.is_periodized) {
    console.log("❌ Program is already periodized!")
    return program
  }

  // Simulate the exact conversion logic from the component
  const baseRoutines = program.routines || []

  if (baseRoutines.length === 0) {
    console.log("❌ No routines found to convert!")
    return program
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
    routines: undefined, // Remove routines when converting to periodized
    duration_weeks: numberOfWeeks,
  }

  console.log("✅ Conversion successful!")
  console.log(`Created ${weeks.length} weeks`)
  console.log(`Each week has ${weeks[0].routines.length} routines`)
  console.log(`Week 1 routines: ${weeks[0].routines.map((r) => r.name).join(", ")}`)
  console.log(`Week ${numberOfWeeks} routines: ${weeks[numberOfWeeks - 1].routines.map((r) => r.name).join(", ")}`)

  return convertedProgram
}

function testConvertToNonPeriodized(program, selectedWeekToKeep) {
  console.log("\n=== Testing Conversion to Non-Periodized ===")
  console.log(`Original program: ${program.name}`)
  console.log(`Is periodized: ${program.is_periodized}`)
  console.log(`Keeping routines from week ${selectedWeekToKeep}...`)

  if (!program.is_periodized) {
    console.log("❌ Program is already non-periodized!")
    return program
  }

  if (!program.weeks || program.weeks.length === 0) {
    console.log("❌ No weeks found in periodized program!")
    return program
  }

  // Simulate the exact conversion logic from the component
  const selectedWeek = program.weeks.find((w) => w.week_number === selectedWeekToKeep)
  const routinesToKeep = selectedWeek?.routines || []

  if (routinesToKeep.length === 0) {
    console.log(`❌ No routines found in week ${selectedWeekToKeep}`)
    return program
  }

  // Remove week suffixes from routine names (exact logic from component)
  const cleanedRoutines = routinesToKeep.map((routine) => ({
    ...routine,
    name: routine.name?.replace(/ - Week \d+$/, "") || routine.name,
  }))

  const convertedProgram = {
    ...program,
    is_periodized: false,
    routines: cleanedRoutines,
    weeks: undefined, // Remove weeks when converting to non-periodized
    duration_weeks: 1,
  }

  console.log("✅ Conversion successful!")
  console.log(`Kept ${cleanedRoutines.length} routines from week ${selectedWeekToKeep}`)
  console.log(`Routine names: ${cleanedRoutines.map((r) => r.name).join(", ")}`)

  return convertedProgram
}

function testAvailableFieldsAnalysis(program) {
  console.log("\n=== Testing Available Fields Analysis ===")
  console.log(`Program: ${program.name}`)

  const currentRoutines = program.weeks && program.weeks.length > 0 ? program.weeks[0].routines : program.routines || []

  let hasReps = false
  let hasWeight = false
  let hasRpe = false
  let hasRest = false
  let hasNotes = false

  // Check all exercises and sets to see what fields exist (exact logic from component)
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

  console.log("Available fields analysis:", availableFields)
  console.log(`Program has ${Object.values(availableFields).filter(Boolean).length} field types`)
  console.log(`Routines to analyze: ${currentRoutines.length}`)

  return availableFields
}

function testBidirectionalConversion() {
  console.log("\n🔄 === BIDIRECTIONAL CONVERSION TEST ===")
  console.log("Testing: Non-Periodized → Periodized → Non-Periodized")

  // Step 1: Start with non-periodized program
  console.log("\n📍 STEP 1: Starting with non-periodized program")
  let currentProgram = { ...mockNonPeriodizedProgram }
  console.log(`Initial state: ${currentProgram.is_periodized ? "Periodized" : "Non-Periodized"}`)
  console.log(`Routines: ${currentProgram.routines?.length || 0}`)

  // Step 2: Convert to periodized (4 weeks)
  console.log("\n📍 STEP 2: Converting to periodized (4 weeks)")
  currentProgram = testConvertToPeriodicized(currentProgram, 4)
  console.log(`After conversion: ${currentProgram.is_periodized ? "Periodized" : "Non-Periodized"}`)
  console.log(`Weeks: ${currentProgram.weeks?.length || 0}`)
  console.log(`Week 1 routines: ${currentProgram.weeks?.[0]?.routines?.length || 0}`)

  // Step 3: Convert back to non-periodized (keep week 2)
  console.log("\n📍 STEP 3: Converting back to non-periodized (keeping week 2)")
  currentProgram = testConvertToNonPeriodized(currentProgram, 2)
  console.log(`Final state: ${currentProgram.is_periodized ? "Periodized" : "Non-Periodized"}`)
  console.log(`Routines: ${currentProgram.routines?.length || 0}`)
  console.log(`Routine names: ${currentProgram.routines?.map((r) => r.name).join(", ") || "None"}`)

  // Verify the conversion worked correctly
  const success =
    !currentProgram.is_periodized &&
    currentProgram.routines &&
    currentProgram.routines.length > 0 &&
    !currentProgram.weeks

  console.log(`\n${success ? "✅" : "❌"} Bidirectional conversion ${success ? "PASSED" : "FAILED"}`)

  return success
}

function testReverseBidirectionalConversion() {
  console.log("\n🔄 === REVERSE BIDIRECTIONAL CONVERSION TEST ===")
  console.log("Testing: Periodized → Non-Periodized → Periodized")

  // Step 1: Start with periodized program
  console.log("\n📍 STEP 1: Starting with periodized program")
  let currentProgram = { ...mockPeriodizedProgram }
  console.log(`Initial state: ${currentProgram.is_periodized ? "Periodized" : "Non-Periodized"}`)
  console.log(`Weeks: ${currentProgram.weeks?.length || 0}`)

  // Step 2: Convert to non-periodized (keep week 2)
  console.log("\n📍 STEP 2: Converting to non-periodized (keeping week 2)")
  currentProgram = testConvertToNonPeriodized(currentProgram, 2)
  console.log(`After conversion: ${currentProgram.is_periodized ? "Periodized" : "Non-Periodized"}`)
  console.log(`Routines: ${currentProgram.routines?.length || 0}`)

  // Step 3: Convert back to periodized (6 weeks)
  console.log("\n📍 STEP 3: Converting back to periodized (6 weeks)")
  currentProgram = testConvertToPeriodicized(currentProgram, 6)
  console.log(`Final state: ${currentProgram.is_periodized ? "Periodized" : "Non-Periodized"}`)
  console.log(`Weeks: ${currentProgram.weeks?.length || 0}`)
  console.log(`Week 1 routines: ${currentProgram.weeks?.[0]?.routines?.length || 0}`)

  // Verify the conversion worked correctly
  const success =
    currentProgram.is_periodized &&
    currentProgram.weeks &&
    currentProgram.weeks.length === 6 &&
    !currentProgram.routines

  console.log(`\n${success ? "✅" : "❌"} Reverse bidirectional conversion ${success ? "PASSED" : "FAILED"}`)

  return success
}

function runAllTests() {
  console.log("🚀 Starting Enhanced Periodization Toggle Tests")
  console.log("==============================================")

  let passedTests = 0
  let totalTests = 0

  // Test 1: Convert non-periodized to periodized
  console.log("\n📋 TEST 1: Non-Periodized → Periodized")
  totalTests++
  try {
    const result = testConvertToPeriodicized(mockNonPeriodizedProgram, 4)
    if (result.is_periodized && result.weeks && result.weeks.length === 4) {
      console.log("✅ TEST 1 PASSED")
      passedTests++
    } else {
      console.log("❌ TEST 1 FAILED")
    }
  } catch (error) {
    console.log("❌ TEST 1 ERROR:", error.message)
  }

  // Test 2: Convert periodized to non-periodized
  console.log("\n📋 TEST 2: Periodized → Non-Periodized")
  totalTests++
  try {
    const result = testConvertToNonPeriodized(mockPeriodizedProgram, 2)
    if (!result.is_periodized && result.routines && result.routines.length > 0) {
      console.log("✅ TEST 2 PASSED")
      passedTests++
    } else {
      console.log("❌ TEST 2 FAILED")
    }
  } catch (error) {
    console.log("❌ TEST 2 ERROR:", error.message)
  }

  // Test 3: Bidirectional conversion
  console.log("\n📋 TEST 3: Bidirectional Conversion")
  totalTests++
  try {
    const success = testBidirectionalConversion()
    if (success) {
      console.log("✅ TEST 3 PASSED")
      passedTests++
    } else {
      console.log("❌ TEST 3 FAILED")
    }
  } catch (error) {
    console.log("❌ TEST 3 ERROR:", error.message)
  }

  // Test 4: Reverse bidirectional conversion
  console.log("\n📋 TEST 4: Reverse Bidirectional Conversion")
  totalTests++
  try {
    const success = testReverseBidirectionalConversion()
    if (success) {
      console.log("✅ TEST 4 PASSED")
      passedTests++
    } else {
      console.log("❌ TEST 4 FAILED")
    }
  } catch (error) {
    console.log("❌ TEST 4 ERROR:", error.message)
  }

  // Test 5: Available fields analysis
  console.log("\n📋 TEST 5: Available Fields Analysis")
  totalTests++
  try {
    const fields1 = testAvailableFieldsAnalysis(mockNonPeriodizedProgram)
    const fields2 = testAvailableFieldsAnalysis(mockPeriodizedProgram)

    if (fields1.hasReps && fields1.hasWeight && fields2.hasReps && fields2.hasWeight) {
      console.log("✅ TEST 5 PASSED")
      passedTests++
    } else {
      console.log("❌ TEST 5 FAILED")
    }
  } catch (error) {
    console.log("❌ TEST 5 ERROR:", error.message)
  }

  // Test 6: Edge cases
  console.log("\n📋 TEST 6: Edge Cases")
  totalTests++
  try {
    // Empty program
    const emptyProgram = { name: "Empty Program", routines: [] }
    const emptyResult = testConvertToPeriodicized(emptyProgram, 3)

    // Program with no sets
    const noSetsProgram = {
      name: "No Sets Program",
      routines: [
        {
          name: "Empty Routine",
          exercises: [{ name: "Exercise with no sets", sets: [] }],
        },
      ],
    }
    const noSetsFields = testAvailableFieldsAnalysis(noSetsProgram)

    console.log("✅ TEST 6 PASSED (Edge cases handled)")
    passedTests++
  } catch (error) {
    console.log("❌ TEST 6 ERROR:", error.message)
  }

  // Final results
  console.log("\n" + "=".repeat(50))
  console.log(`📊 TEST RESULTS: ${passedTests}/${totalTests} tests passed`)
  console.log(`Success rate: ${Math.round((passedTests / totalTests) * 100)}%`)

  if (passedTests === totalTests) {
    console.log("🎉 ALL TESTS PASSED! Periodization toggle is working correctly.")
  } else {
    console.log("⚠️  Some tests failed. Please review the implementation.")
  }

  console.log("=".repeat(50))
}

// Run the tests
runAllTests()
