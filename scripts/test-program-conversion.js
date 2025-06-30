const admin = require("firebase-admin")
const { v4: uuidv4 } = require("uuid")

// Initialize Firebase Admin (you'll need to add your service account)
const serviceAccount = require("./serviceAccount.json")
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

// Test program data (similar to your PT program format)
const testProgram = {
  program_title: "Test Strength Program",
  program_notes: "A test program for conversion",
  program_weeks: 4,
  is_periodized: true,
  weeks: [
    {
      week_number: 1,
      routines: [
        {
          routine_name: "Upper Body",
          routine_rank: "1",
          exercises: [
            {
              name: "Bench Press",
              exercise_category: "Push",
              notes: "Focus on form",
              weeks: [
                {
                  week_number: 1,
                  set_count: 3,
                  sets: [
                    { set_number: 1, warmup: true, reps: "8", weight: "60", rpe: "6", rest: "90s", notes: null },
                    { set_number: 2, warmup: false, reps: "8", weight: "70", rpe: "7", rest: "90s", notes: null },
                    { set_number: 3, warmup: false, reps: "8", weight: "75", rpe: "8", rest: "90s", notes: null },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

// Test client user ID (replace with actual client user ID)
const testClientUserId = "TEST_CLIENT_USER_ID"

async function testConversion() {
  try {
    console.log("🧪 Testing program conversion...")

    // You would call your conversion function here
    // For now, let's just test the structure

    const routineId = uuidv4()
    const programId = uuidv4()
    const timestamp = admin.firestore.Timestamp.now()

    // Test routine creation
    const testRoutine = {
      id: routineId,
      name: "Test Upper Body",
      notes: "",
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
      type: "program",
      exercises: [
        {
          id: "test-exercise-id",
          name: "Bench Press",
          sets: [
            {
              id: uuidv4(),
              type: "warmup",
              weight: "60",
              reps: "8",
              notes: "RPE: 6 | Rest: 90s",
            },
            {
              id: uuidv4(),
              type: "normal",
              weight: "70",
              reps: "8",
              notes: "RPE: 7 | Rest: 90s",
            },
          ],
        },
      ],
    }

    console.log("✅ Test routine structure:", JSON.stringify(testRoutine, null, 2))

    // Test program creation
    const testProgramDoc = {
      id: programId,
      name: testProgram.program_title,
      notes: testProgram.program_notes,
      startedAt: timestamp,
      duration: testProgram.program_weeks,
      createdAt: timestamp,
      updated_at: timestamp,
      routines: [
        {
          routineId: routineId,
          week: 1,
          order: 1,
        },
      ],
    }

    console.log("✅ Test program structure:", JSON.stringify(testProgramDoc, null, 2))
    console.log("🎉 Test conversion completed successfully!")
  } catch (error) {
    console.error("❌ Test conversion failed:", error)
  }
}

// Run the test
testConversion()
