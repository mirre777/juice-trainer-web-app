import { type NextRequest, NextResponse } from "next/server"
import { programConversionService } from "@/lib/firebase/program-conversion-service"

export async function POST(request: NextRequest) {
  try {
    console.log("[toggle-periodization API] === STARTING PERIODIZATION TOGGLE ===")

    const body = await request.json()
    console.log("[toggle-periodization API] Request body:", JSON.stringify(body, null, 2))

    const { programData } = body

    // Validate required fields
    if (!programData) {
      console.log("[toggle-periodization API] ❌ Missing programData")
      return NextResponse.json(
        { error: "Program data is required", details: "programData field is missing from request" },
        { status: 400 },
      )
    }

    console.log("[toggle-periodization API] Current program structure:", {
      is_periodized: programData.is_periodized,
      hasWeeks: !!programData.weeks?.length,
      hasRoutines: !!programData.routines?.length,
      weeksLength: programData.weeks?.length,
      routinesLength: programData.routines?.length,
    })

    // Toggle the periodization
    const convertedProgram = programConversionService.togglePeriodization(programData)

    console.log("[toggle-periodization API] ✅ Periodization toggled successfully:", {
      was_periodized: programData.is_periodized,
      now_periodized: convertedProgram.is_periodized,
      hasWeeks: !!convertedProgram.weeks?.length,
      hasRoutines: !!convertedProgram.routines?.length,
    })

    return NextResponse.json({
      success: true,
      message: "Periodization toggled successfully",
      program: convertedProgram,
    })
  } catch (error) {
    console.error("[toggle-periodization API] ❌ Error toggling periodization:", error)

    // Provide detailed error information
    const errorDetails = {
      message: error.message,
      stack: error.stack?.substring(0, 1000), // Limit stack trace length
      name: error.name,
    }

    return NextResponse.json(
      {
        error: "Failed to toggle periodization",
        details: errorDetails,
      },
      { status: 500 },
    )
  }
}
