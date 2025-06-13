export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { google } from "googleapis"
import { getTokenFromServer } from "@/lib/auth/token-service"
import type {
  WorkoutProgram,
  WorkoutRoutine,
  ProgramExercise,
  ExerciseWeek,
  ExerciseSet,
} from "@/types/workout-program"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sheetId = searchParams.get("sheetId")

    if (!sheetId) {
      return NextResponse.json({ message: "Sheet ID is required" }, { status: 400 })
    }

    // Get the user's Google token
    const token = await getTokenFromServer()

    if (!token) {
      return NextResponse.json({ message: "You need to connect your Google account first" }, { status: 401 })
    }

    // Initialize Google Sheets API
    const sheets = google.sheets({ version: "v4", auth: token })

    // Fetch the sheet data
    const response = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      includeGridData: true,
    })

    // Process the sheet data and convert to program format
    const program = convertSheetDataToProgram(response.data)

    return NextResponse.json(program)
  } catch (error: any) {
    // Explicitly type error as 'any' for error.code access
    console.error("Google Sheets import error:", error)

    if (error.code === 403) {
      return NextResponse.json(
        { message: "Sheet is private. Please share with 'Anyone with link can view'" },
        { status: 403 },
      )
    }

    return NextResponse.json({ message: "Failed to import from Google Sheets" }, { status: 500 })
  }
}

// Function to convert Google Sheets data to program format
function convertSheetDataToProgram(sheetData: any): WorkoutProgram {
  // This is a simplified implementation
  // In a real application, you would need to parse the sheet data according to your expected format

  // Extract program metadata from the first sheet
  const overviewSheet = sheetData.sheets?.[0]
  const overviewData = overviewSheet?.data?.[0]?.rowData || []

  // Basic program structure
  const program: WorkoutProgram = {
    program_title: extractCellValue(overviewData, 1, 1) || "Imported Program",
    program_notes: extractCellValue(overviewData, 2, 1) || "",
    program_weeks: Number.parseInt(extractCellValue(overviewData, 3, 1) || "4", 10),
    routine_count: sheetData.sheets?.length - 1 || 0,
    routines: [],
  }

  // Process each routine sheet (assuming each sheet after the first is a routine)
  for (let i = 1; i < sheetData.sheets?.length; i++) {
    const routineSheet = sheetData.sheets[i]
    const routineName = routineSheet.properties?.title || `Routine ${i}`

    const routine = processRoutineSheet(routineSheet, program.program_weeks)
    routine.routine_name = routineName
    routine.routine_rank = `${i}`

    program.routines.push(routine)
  }

  return program
}

function processRoutineSheet(sheet: any, programWeeks: number): WorkoutRoutine {
  const routine: WorkoutRoutine = {
    routine_name: sheet.properties?.title || "Unnamed Routine",
    routine_rank: "1",
    exercises: [],
  }

  const rowData = sheet.data?.[0]?.rowData || []

  // Skip header row(s)
  let currentRow = 2

  while (currentRow < rowData.length) {
    const exerciseName = extractCellValue(rowData, currentRow, 0)

    if (!exerciseName) {
      currentRow++
      continue
    }

    const exercise: ProgramExercise = {
      exercise: exerciseName,
      exercise_category: extractCellValue(rowData, currentRow, 1) || "Other",
      exercise_video: extractCellValue(rowData, currentRow, 2) || null,
      exercise_notes: extractCellValue(rowData, currentRow, 3) || null,
      weeks: [],
    }

    // Process weeks for this exercise
    for (let week = 1; week <= programWeeks; week++) {
      const weekData = processWeekData(rowData, currentRow, week)
      exercise.weeks.push(weekData)
    }

    routine.exercises.push(exercise)
    currentRow += 2 // Assuming each exercise takes 2 rows (can be adjusted based on your sheet format)
  }

  return routine
}

function processWeekData(rowData: any[], startRow: number, weekNumber: number): ExerciseWeek {
  // This is a simplified implementation
  // You would need to adjust this based on your actual sheet layout

  const week: ExerciseWeek = {
    week_number: weekNumber,
    set_count: 3, // Default value
    sets: [],
  }

  // Assuming sets are in columns starting from column 4 (index 3)
  // and each week has its own column group
  const weekStartCol = 4 + (weekNumber - 1) * 5

  // Get set count
  const setCountCell = extractCellValue(rowData, startRow, weekStartCol)
  if (setCountCell && !isNaN(Number.parseInt(setCountCell, 10))) {
    week.set_count = Number.parseInt(setCountCell, 10)
  }

  // Process each set
  for (let setNum = 1; setNum <= week.set_count; setNum++) {
    const set: ExerciseSet = {
      set_number: setNum,
      warmup: setNum === 1, // Assume first set is warmup
      reps: extractCellValue(rowData, startRow + 1, weekStartCol + setNum - 1) || null,
      rpe: extractCellValue(rowData, startRow + 2, weekStartCol + setNum - 1) || null,
      rest: extractCellValue(rowData, startRow + 3, weekStartCol + setNum - 1) || null,
      notes: null,
    }

    week.sets.push(set)
  }

  return week
}

function extractCellValue(rowData: any[], rowIndex: number, colIndex: number): string | null {
  if (!rowData[rowIndex] || !rowData[rowIndex].values || !rowData[rowIndex].values[colIndex]) {
    return null
  }

  const cell = rowData[rowIndex].values[colIndex]
  return cell.formattedValue || null
}
