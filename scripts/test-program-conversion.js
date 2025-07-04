// Test script to demonstrate program conversion
// This shows the expected data structure and how the conversion works

const testProgramData = {
  program_title: "5x Upper/Lower/Full - Base Building Phase, TC1",
  program_notes: "Base building phase focusing on strength and muscle development",
  program_weeks: 2,
  is_periodized: true,
  weeks: [
    {
      week_number: 1,
      routines: [
        {
          routine_name: "Day 1 - Upper, Heavy (Sun)",
          notes: "",
          exercises: [
            {
              name: "Bench Press",
              notes: "1a.",
              sets: [
                {
                  set_number: 1,
                  reps: "5",
                  weight: "",
                  rpe: "7-8",
                  rest: "",
                  notes: "",
                  warmup: false,
                  set_type: "normal",
                },
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
          routine_name: "Day 1 - Upper, Heavy (Sun)",
          notes: "",
          exercises: [
            {
              name: "Bench Press",
              notes: "1a.",
              sets: [
                {
                  set_number: 1,
                  reps: "6",
                  weight: "",
                  rpe: "8-9",
                  rest: "",
                  notes: "",
                  warmup: false,
                  set_type: "normal",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

console.log("Test Program Data Structure:")
console.log(JSON.stringify(testProgramData, null, 2))

console.log("\nExpected Mobile App Structure:")
console.log("Program Document:")
console.log({
  id: "generated-uuid",
  name: "5x Upper/Lower/Full - Base Building Phase, TC1",
  notes: "Base building phase focusing on strength and muscle development",
  duration: 2,
  createdAt: "2025-06-23T13:08:40.000Z",
  updated_at: "2025-06-23T13:08:40.000Z",
  routines: [
    {
      routineId: "generated-routine-uuid-1",
      week: 1,
      order: 1,
    },
    {
      routineId: "generated-routine-uuid-2",
      week: 2,
      order: 1,
    },
  ],
})

console.log("\nRoutine Document Example:")
console.log({
  id: "generated-routine-uuid-1",
  name: "Day 1 - Upper, Heavy (Sun)",
  notes: "",
  type: "program", // This is the key flag for mobile app filtering
  createdAt: "2025-06-23T13:08:28.000Z",
  updatedAt: "2025-06-24T09:12:28.000Z",
  deletedAt: null,
  exercises: [
    {
      id: "exercise-uuid-or-existing-id",
      name: "Bench Press",
      sets: [
        {
          id: "generated-set-uuid",
          type: "normal",
          weight: "",
          reps: "5",
          notes: "RPE: 7-8",
        },
      ],
    },
  ],
})

console.log("\nExercise Document Example:")
console.log({
  id: "exercise-uuid",
  name: "Bench Press",
  muscleGroup: "Chest",
  isCardio: false,
  isFullBody: false,
  isMobility: false,
  createdAt: "timestamp",
  updatedAt: "timestamp",
  deletedAt: null,
})
