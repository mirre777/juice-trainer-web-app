const admin = require("firebase-admin")
const fs = require("fs")
const { v4: uuidv4 } = require("uuid")

// Initialize Firebase Admin (you'll need to provide your service account)
// const serviceAccount = require("./serviceAccount.json");
// admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

// Mock data for testing
const mockProgram = {
  title: "Test Training Program",
  notes: "This is a test program",
  weeks: [
    {
      week_number: 1,
      routines: [
        {
          name: "Upper Body",
          notes: "Focus on form",
          order: 1,
          exercises: [
            {
              name: "Bench Press",
              sets: [
                { reps: "10", type: "normal", weight: "60" },
                { reps: "8", type: "normal", weight: "65" },
                { reps: "6", type: "normal", weight: "70" },
              ],
            },
            {
              name: "Pull-ups",
              sets: [
                { reps: "8", type: "normal", weight: "bodyweight" },
                { reps: "6", type: "normal", weight: "bodyweight" },
                { reps: "4", type: "normal", weight: "bodyweight" },
              ],
            },
          ],
        },
        {
          name: "Lower Body",
          notes: "Focus on depth",
          order: 2,
          exercises: [
            {
              name: "Squats",
              sets: [
                { reps: "12", type: "normal", weight: "80" },
                { reps: "10", type: "normal", weight: "85" },
                { reps: "8", type: "normal", weight: "90" },
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
          name: "Upper Body",
          notes: "Increase intensity",
          order: 1,
          exercises: [
            {
              name: "Bench Press",
              sets: [
                { reps: "8", type: "normal", weight: "65" },
                { reps: "6", type: "normal", weight: "70" },
                { reps: "4", type: "normal", weight: "75" },
              ],
            },
          ],
        },
      ],
    },
  ],
}

console.log("Mock Program Structure:")
console.log(JSON.stringify(mockProgram, null, 2))

console.log("\nExpected Conversion Output:")
console.log("- Total weeks:", mockProgram.weeks.length)
console.log(
  "- Total routines:",
  mockProgram.weeks.reduce((acc, week) => acc + week.routines.length, 0),
)
console.log("- Unique exercises:", [
  ...new Set(
    mockProgram.weeks.flatMap((week) => week.routines.flatMap((routine) => routine.exercises.map((ex) => ex.name))),
  ),
])

// This would be the actual conversion process:
// const { programConversionService } = require("../lib/firebase/program-conversion-service");
// const programId = await programConversionService.convertAndSendProgram(mockProgram, "client-user-id");
// console.log("Program converted with ID:", programId);
