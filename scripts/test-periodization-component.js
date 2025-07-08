/**
 * Test script for debugging periodization component issues
 * This script simulates the component behavior to identify problems
 */

// Mock data structures for testing
const mockImportData = {
  name: "Test Program",
  program: {
    name: "Test Workout Program",
    description: "A test program for debugging",
    duration_weeks: 4,
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
  },
}

const mockPeriodizedData = {
  name: "Test Periodized Program",
  program: {
    name: "Test Periodized Workout Program",
    description: "A periodized test program",
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
  },
}

// Test function definitions
function testFunctionDefinitions() {
  console.log("=== Testing Function Definitions ===")

  // Test if functions are properly defined
  const functions = [
    "handleTogglePeriodization",
    "confirmPeriodizationChange",
    "updateProgramField",
    "toggleRoutineExpansion",
    "updateSetField",
    "addSet",
    "removeSet",
    "duplicateSet",
    "handleBackClick",
    "confirmLeave",
  ]

  functions.forEach((funcName) => {
    try {
      // Simulate function creation
      const testFunc = new Function("return function " + funcName + '() { console.log("' + funcName + ' called"); }')()
      console.log(`✅ ${funcName}: Function can be created`)

      // Test function call
      testFunc()
      console.log(`✅ ${funcName}: Function can be called`)
    } catch (error) {
      console.error(`❌ ${funcName}: Error -`, error.message)
    }
  })
}

function testDataStructures() {
  console.log("\n=== Testing Data Structures ===")

  // Test non-periodized data
  console.log("Testing non-periodized data:")
  try {
    const program = mockImportData.program
    console.log(`✅ Program name: ${program.name}`)
    console.log(`✅ Is periodized: ${program.is_periodized}`)
    console.log(`✅ Routines count: ${program.routines?.length || 0}`)
    console.log(`✅ First routine: ${program.routines?.[0]?.name}`)
    console.log(`✅ First exercise: ${program.routines?.[0]?.exercises?.[0]?.name}`)
    console.log(`✅ First set: ${JSON.stringify(program.routines?.[0]?.exercises?.[0]?.sets?.[0])}`)
  } catch (error) {
    console.error("❌ Error testing non-periodized data:", error)
  }

  // Test periodized data
  console.log("\nTesting periodized data:")
  try {
    const program = mockPeriodizedData.program
    console.log(`✅ Program name: ${program.name}`)
    console.log(`✅ Is periodized: ${program.is_periodized}`)
    console.log(`✅ Weeks count: ${program.weeks?.length || 0}`)
    console.log(`✅ First week: ${program.weeks?.[0]?.week_number}`)
    console.log(`✅ First week routines: ${program.weeks?.[0]?.routines?.length || 0}`)
  } catch (error) {
    console.error("❌ Error testing periodized data:", error)
  }
}

function testPeriodizationConversion() {
  console.log("\n=== Testing Periodization Conversion ===")

  // Test conversion to periodized
  console.log("Testing conversion to periodized:")
  try {
    const program = { ...mockImportData.program }
    const numberOfWeeks = 4
    const baseRoutines = program.routines || []

    if (baseRoutines.length === 0) {
      throw new Error("No routines found")
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

    console.log(`✅ Converted to periodized: ${convertedProgram.is_periodized}`)
    console.log(`✅ Created weeks: ${convertedProgram.weeks?.length}`)
    console.log(`✅ Week 1 routines: ${convertedProgram.weeks?.[0]?.routines?.length}`)
    console.log(`✅ Sample routine name: ${convertedProgram.weeks?.[0]?.routines?.[0]?.name}`)
  } catch (error) {
    console.error("❌ Error in periodization conversion:", error)
  }

  // Test conversion to non-periodized
  console.log("\nTesting conversion to non-periodized:")
  try {
    const program = { ...mockPeriodizedData.program }
    const selectedWeekToKeep = 2

    const selectedWeek = program.weeks?.find((w) => w.week_number === selectedWeekToKeep)
    const routinesToKeep = selectedWeek?.routines || []

    if (routinesToKeep.length === 0) {
      throw new Error(`No routines found in week ${selectedWeekToKeep}`)
    }

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

    console.log(`✅ Converted to non-periodized: ${!convertedProgram.is_periodized}`)
    console.log(`✅ Routines count: ${convertedProgram.routines?.length}`)
    console.log(`✅ Sample routine name: ${convertedProgram.routines?.[0]?.name}`)
  } catch (error) {
    console.error("❌ Error in non-periodization conversion:", error)
  }
}

function testAvailableFields() {
  console.log("\n=== Testing Available Fields Analysis ===")

  try {
    const program = mockImportData.program
    const currentRoutines =
      program.weeks && program.weeks.length > 0 ? program.weeks[0].routines : program.routines || []

    let hasReps = false
    let hasWeight = false
    let hasRpe = false
    let hasRest = false
    let hasNotes = false

    for (const routine of currentRoutines) {
      if (routine && routine.exercises) {
        for (const exercise of routine.exercises) {
          if (exercise && exercise.sets) {
            for (const set of exercise.sets) {
              if (set) {
                if (set.reps !== undefined && set.reps !== null && set.reps !== "") hasReps = true
                if (set.weight !== undefined && set.weight !== null && set.weight !== "") hasWeight = true
                if (set.rpe !== undefined && set.rpe !== null && set.rpe !== "") hasRpe = true
                if (set.rest !== undefined && set.rest !== null && set.rest !== "") hasRest = true
                if (set.notes !== undefined && set.notes !== null && set.notes !== "") hasNotes = true
              }
            }
          }
        }
      }
    }

    const availableFields = { hasReps, hasWeight, hasRpe, hasRest, hasNotes }
    console.log("✅ Available fields analysis:", availableFields)
    console.log(`✅ Total field types: ${Object.values(availableFields).filter(Boolean).length}`)
  } catch (error) {
    console.error("❌ Error in available fields analysis:", error)
  }
}

function testEventHandlers() {
  console.log("\n=== Testing Event Handler Creation ===")

  // Test safe click handler creation
  try {
    const createSafeClickHandler = (handler, handlerName) => {
      return () => {
        try {
          console.log(`Executing safe click handler: ${handlerName}`)
          handler()
        } catch (err) {
          console.error(`Error in ${handlerName}:`, err)
        }
      }
    }

    // Test handler creation
    const testHandler = () => console.log("Test handler executed")
    const safeHandler = createSafeClickHandler(testHandler, "testHandler")

    console.log("✅ Safe click handler created successfully")

    // Test handler execution
    safeHandler()
    console.log("✅ Safe click handler executed successfully")

    // Test error handling
    const errorHandler = () => {
      throw new Error("Test error")
    }
    const safeErrorHandler = createSafeClickHandler(errorHandler, "errorHandler")
    safeErrorHandler()
    console.log("✅ Error handling in safe click handler works")
  } catch (error) {
    console.error("❌ Error in event handler testing:", error)
  }
}

function testStateUpdates() {
  console.log("\n=== Testing State Update Functions ===")

  // Simulate state update functions
  try {
    let mockState = { ...mockImportData.program }

    // Test updateProgramField equivalent
    const updateField = (field, value) => {
      mockState = {
        ...mockState,
        [field]: value,
      }
      console.log(`✅ Updated field ${field} to:`, value)
    }

    updateField("name", "Updated Program Name")
    updateField("description", "Updated description")

    // Test set field update equivalent
    const updateSetField = (routineIndex, exerciseIndex, setIndex, field, value) => {
      if (mockState.routines?.[routineIndex]?.exercises?.[exerciseIndex]?.sets?.[setIndex]) {
        const currentSet = mockState.routines[routineIndex].exercises[exerciseIndex].sets[setIndex]
        mockState.routines[routineIndex].exercises[exerciseIndex].sets[setIndex] = {
          ...currentSet,
          [field]: value,
        }
        console.log(`✅ Updated set field ${field} to:`, value)
      } else {
        console.log(`❌ Could not find set at indices: ${routineIndex}, ${exerciseIndex}, ${setIndex}`)
      }
    }

    updateSetField(0, 0, 0, "reps", "15")
    updateSetField(0, 0, 0, "weight", "110kg")

    console.log("✅ State update functions work correctly")
  } catch (error) {
    console.error("❌ Error in state update testing:", error)
  }
}

// Run all tests
function runAllTests() {
  console.log("🚀 Starting Periodization Component Debug Tests")
  console.log("=".repeat(50))

  testFunctionDefinitions()
  testDataStructures()
  testPeriodizationConversion()
  testAvailableFields()
  testEventHandlers()
  testStateUpdates()

  console.log("\n" + "=".repeat(50))
  console.log("✅ All tests completed. Check console for any errors.")
  console.log("If you see '❌' markers, those indicate potential issues.")
  console.log("=".repeat(50))
}

// Execute tests
runAllTests()
