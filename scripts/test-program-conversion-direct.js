import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { programConversionService } from "../lib/firebase/program-conversion-service.js"

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

console.log("🚀 === DIRECT PROGRAM CONVERSION TEST ===")
console.log("📋 Test Parameters:")
console.log("  - Trainer ID: 5tVdK6LXCifZgjxD7rml3nEOXmh1")
console.log("  - Client ID: CGLJmpv59IngpsYpW7PZ")
console.log("  - User ID: HN2QjNvnWKQ37nVXCSkhXdCwMEH2")
console.log("")

// Test program data - simple structure
const testProgramData = {
  program_title: "Test Program - Direct Push",
  program_notes: "Testing direct program conversion without UI",
  program_weeks: 2,
  is_periodized: true,
  weeks: [
    {
      week_number: 1,
      routines: [
        {
          routine_name: "Day 1 - Upper Body",
          notes: "Focus on compound movements",
          exercises: [
            {
              name: "Bench Press",
              notes: "1a. Primary chest exercise",
              sets: [
                {
                  set_number: 1,
                  reps: "8",
                  weight: "100",
                  rpe: "7",
                  rest: "2min",
                  notes: "Warm up set",
                  warmup: false,
                  set_type: "normal",
                },
                {
                  set_number: 2,
                  reps: "6",
                  weight: "120",
                  rpe: "8",
                  rest: "3min",
                  notes: "Working set",
                  warmup: false,
                  set_type: "normal",
                },
              ],
            },
            {
              name: "Pull-ups",
              notes: "1b. Back exercise",
              sets: [
                {
                  set_number: 1,
                  reps: "10",
                  weight: "bodyweight",
                  rpe: "7",
                  rest: "2min",
                  notes: "Controlled tempo",
                  warmup: false,
                  set_type: "normal",
                },
              ],
            },
          ],
        },
        {
          routine_name: "Day 2 - Lower Body",
          notes: "Leg day focus",
          exercises: [
            {
              name: "Squats",
              notes: "1a. Primary leg exercise",
              sets: [
                {
                  set_number: 1,
                  reps: "10",
                  weight: "80",
                  rpe: "6",
                  rest: "2min",
                  notes: "Warm up",
                  warmup: true,
                  set_type: "warmup",
                },
                {
                  set_number: 2,
                  reps: "8",
                  weight: "100",
                  rpe: "8",
                  rest: "3min",
                  notes: "Working set",
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
          routine_name: "Day 1 - Upper Body",
          notes: "Week 2 progression",
          exercises: [
            {
              name: "Bench Press",
              notes: "1a. Increased intensity",
              sets: [
                {
                  set_number: 1,
                  reps: "6",
                  weight: "125",
                  rpe: "8",
                  rest: "3min",
                  notes: "Progressive overload",
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

async function testDirectProgramConversion() {
  try {
    console.log("🔍 Step 1: Testing client userId lookup...")

    const trainerId = "5tVdK6LXCifZgjxD7rml3nEOXmh1"
    const clientId = "CGLJmpv59IngpsYpW7PZ"

    // Test getting client userId
    const userId = await programConversionService.getClientUserId(trainerId, clientId)

    if (!userId) {
      console.error("❌ FAILED: Could not get userId for client")
      return
    }

    console.log(`✅ Found userId: ${userId}`)
    console.log("")

    console.log("🔍 Step 2: Testing program conversion...")
    console.log("📄 Program structure:")
    console.log(`  - Title: ${testProgramData.program_title}`)
    console.log(`  - Weeks: ${testProgramData.program_weeks}`)
    console.log(`  - Week 1 routines: ${testProgramData.weeks[0].routines.length}`)
    console.log(`  - Week 2 routines: ${testProgramData.weeks[1].routines.length}`)
    console.log("")

    // Convert and send program
    console.log("🚀 Converting and sending program...")
    const programId = await programConversionService.convertAndSendProgram(testProgramData, userId)

    console.log("")
    console.log("🎉 === SUCCESS ===")
    console.log(`✅ Program created with ID: ${programId}`)
    console.log("")
    console.log("🔍 Check Firebase at these paths:")
    console.log(`  - Program: /users/${userId}/programs/${programId}`)
    console.log(`  - Routines: /users/${userId}/routines/[routine-ids]`)
    console.log(`  - Exercises: /users/${userId}/exercises/[exercise-ids]`)
    console.log("")
    console.log("📱 The program should now be visible in the mobile app!")
  } catch (error) {
    console.error("")
    console.error("❌ === CONVERSION FAILED ===")
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack?.substring(0, 500),
    })

    if (error.message.includes("permission")) {
      console.error("")
      console.error("🔒 PERMISSION ISSUE:")
      console.error("  - Check Firestore security rules")
      console.error("  - Verify Firebase admin credentials")
      console.error("  - Ensure service account has write permissions")
    }

    if (error.message.includes("not found")) {
      console.error("")
      console.error("📄 DOCUMENT NOT FOUND:")
      console.error("  - Client document might not exist")
      console.error("  - User document might not exist")
      console.error("  - Check document IDs are correct")
    }
  }
}

// Run the test
testDirectProgramConversion()
