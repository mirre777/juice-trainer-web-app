const admin = require("firebase-admin")
const { v4: uuidv4 } = require("uuid")

// Initialize Firebase Admin (you'll need to provide your service account)
const serviceAccount = require("./serviceAccount.json")

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

const db = admin.firestore()

// Test program data structure
const testProgram = {
  title: "Test Training Program",
  notes: "This is a test program for conversion",
  is_periodized: true,
  program_weeks: 2,
  weeks: [
    {
      week_number: 1,
      routines: [
        {
          name: "Upper Body",
          exercises: [
            {
              name: "Bench Press",
              sets: [
                { reps: "10", weight: "80", rpe: "7", rest: "90s" },
                { reps: "8", weight: "85", rpe: "8", rest: "90s" },
                { reps: "6", weight: "90", rpe: "9", rest: "120s" },
              ],
            },
            {
              name: "Pull-ups",
              sets: [
                { reps: "8", weight: "bodyweight", rpe: "7", rest: "60s" },
                { reps: "6", weight: "bodyweight", rpe: "8", rest: "60s" },
              ],
            },
          ],
        },
      ],
    },
    {
      week_number: 2,
      routines: [
        {
          name: "Lower Body",
          exercises: [
            {
              name: "Squats",
              sets: [
                { reps: "12", weight: "100", rpe: "7", rest: "90s" },
                { reps: "10", weight: "110", rpe: "8", rest: "90s" },
              ],
            },
          ],
        },
      ],
    },
  ],
}

async function testConversion() {
  const clientUserId = "test-client-user-id"

  try {
    console.log("Starting program conversion test...")

    // This would normally be called from your service
    const timestamp = new Date()
    const routineMap = []

    // Process weeks and routines
    for (const week of testProgram.weeks) {
      const weekNumber = week.week_number

      for (const routine of week.routines) {
        const routineId = uuidv4()

        // Create routine document
        const routineDoc = {
          id: routineId,
          name: routine.name,
          notes: "",
          createdAt: timestamp.toISOString(),
          updatedAt: timestamp.toISOString(),
          deletedAt: null,
          type: "program",
          exercises: routine.exercises.map((exercise) => ({
            id: uuidv4(), // In real implementation, this would be looked up/created
            name: exercise.name,
            sets: exercise.sets.map((set) => ({
              id: uuidv4(),
              type: "normal",
              weight: set.weight || "",
              reps: set.reps || "",
              notes: [set.rpe ? `RPE: ${set.rpe}` : "", set.rest ? `Rest: ${set.rest}` : ""]
                .filter(Boolean)
                .join(" | "),
            })),
          })),
        }

        console.log(`Created routine: ${routine.name} for week ${weekNumber}`)
        console.log(JSON.stringify(routineDoc, null, 2))

        routineMap.push({
          routineId,
          week: weekNumber,
          order: 1,
        })
      }
    }

    // Create program document
    const programId = uuidv4()
    const programDoc = {
      id: programId,
      name: testProgram.title,
      notes: testProgram.notes,
      startedAt: timestamp.toISOString(),
      duration: testProgram.program_weeks,
      createdAt: timestamp.toISOString(),
      updated_at: timestamp.toISOString(),
      routines: routineMap,
    }

    console.log("\nCreated program:")
    console.log(JSON.stringify(programDoc, null, 2))

    console.log("\n✅ Program conversion test completed successfully!")
  } catch (error) {
    console.error("❌ Error during conversion test:", error)
  }
}

// Run the test
testConversion()
