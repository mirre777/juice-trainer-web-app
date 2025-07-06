/**
 * Test script for periodization toggle functionality
 * Tests the conversion logic between periodized and non-periodized programs
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
      ],
    },
  ],
}

// Test functions
function testConvertToPeriodicized(program, numberOfWeeks) {
  console.log("\n=== Testing Conversion to Periodized ===")
  console.log(`Original program: ${program.name}`)
  console.log(`Is periodized: ${program.is_periodized}`)
  console.log(`Converting to ${numberOfWeeks} weeks...`)

  if (program.is_periodized) {
    console.log("❌ Program is already periodized!")
    return program
  }

  // Simulate the conversion logic from the component
  const baseRoutines = program.routines || []
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
  console.log(`Created ${weeks.length} weeks`)
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

  // Simulate the conversion logic from the component
  const selectedWeek = program.weeks?.find((w) => w.week_number === selectedWeekToKeep)
  const routinesToKeep = selectedWeek?.routines || []

  if (routinesToKeep.length === 0) {
    console.log(`❌ No routines found in week ${selectedWeekToKeep}`)
    return program
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
  console.log(`Kept ${cleanedRoutines.length} routines from week ${selectedWeekToKeep}`)
  console.log(`Routine names: ${cleanedRoutines.map((r) => r.name).join(", ")}`)

  return convertedProgram
}

function testAvailableFieldsAnalysis(program) {
  console.log("\n=== Testing Available Fields Analysis ===")

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

  console.log("Available fields analysis:", availableFields)
  console.log(`Program has ${Object.values(availableFields).filter(Boolean).length} field types`)

  return availableFields
}

function runAllTests() {
  console.log("🚀 Starting Periodization Toggle Tests")
  console.log("=====================================")

  // Test 1: Convert non-periodized to periodized
  console.log("\n📋 TEST 1: Non-Periodized → Periodized")
  const convertedToPeriodized = testConvertToPeriodicized(mockNonPeriodizedProgram, 4)

  // Test 2: Convert periodized back to non-periodized
  console.log("\n📋 TEST 2: Periodized → Non-Periodized")
  const convertedBackToNonPeriodized = testConvertToNonPeriodized(convertedToPeriodized, 2)

  // Test 3: Convert already periodized to non-periodized
  console.log("\n📋 TEST 3: Already Periodized → Non-Periodized")
  const convertedPeriodizedToNon = testConvertToNonPeriodized(mockPeriodizedProgram, 2)

  // Test 4: Test available fields analysis
  console.log("\n📋 TEST 4: Available Fields Analysis")
  testAvailableFieldsAnalysis(mockNonPeriodizedProgram)
  testAvailableFieldsAnalysis(mockPeriodizedProgram)

  // Test 5: Edge cases
  console.log("\n📋 TEST 5: Edge Cases")

  // Empty program
  const emptyProgram = { name: "Empty Program", routines: [] }
  console.log("\nTesting empty program:")
  testAvailableFieldsAnalysis(emptyProgram)

  // Program with no sets
  const noSetsProgram = {
    name: "No Sets Program",
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
  console.log("\nTesting program with no sets:")
  testAvailableFieldsAnalysis(noSetsProgram)

  console.log("\n✅ All tests completed!")
  console.log("=====================================")
}

// Run the tests
runAllTests()
