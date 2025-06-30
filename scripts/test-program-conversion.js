const admin = require("firebase-admin")
const { v4: uuidv4 } = require("uuid")

// Initialize Firebase Admin (you'll need to add your service account)
const serviceAccount = require("./serviceAccount.json")
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

// Test program data
const testProgram = {
  program_title: "Test Strength Program",
  program_notes: "A test program for conversion",
  program_weeks: 4,
  is_periodized: false,
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
              sets: [
                {
                  set_number: 1,
                  warmup: true,
                  reps: "8",
                  weight: "60",
                  rpe: "6",
                  rest: "90s",
                  notes: null,
                },
                {
                  set_number: 2,
                  warmup: false,
                  reps: "8",
                  weight: "80",
                  rpe: "8",
                  rest: "90s",
                  notes: null,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

// Test the conversion
async function testConversion() {
  const userId = "test-user-id" // Replace with actual test user ID
  const trainerId = "test-trainer-id" // Replace with actual trainer ID
  const clientId = "test-client-id" // Replace with actual client ID

  try {
    console.log("Testing program conversion...")

    // You would call your conversion function here
    // const result = await convertAndSendProgramToClient(trainerId, clientId, testProgram)

    console.log("Conversion test completed")
  } catch (error) {
    console.error("Conversion test failed:", error)
  }
}

// Run the test
testConversion()
