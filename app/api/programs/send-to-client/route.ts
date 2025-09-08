import { type NextRequest, NextResponse } from "next/server"
import { programConversionService } from "@/lib/firebase/program-conversion-service"
import { getUserIdFromCookie } from "@/lib/utils/user"

export async function POST(request: NextRequest) {
  try {
    console.log("[send-to-client API] === STARTING PROGRAM SEND REQUEST ===")

    const body = await request.json()
    console.log("[send-to-client API] Request body:", JSON.stringify(body, null, 2))

    const { clientId, programData, customMessage } = body

    const trainerId = await getUserIdFromCookie()
    if (!trainerId) {
      console.log("[send-to-client API] ❌ Missing userId")
      return NextResponse.json(
        { error: "Unauthorized", details: "userId field is missing from request" },
        { status: 401 },
      )
    }

    // Validate required fields
    if (!clientId) {
      console.log("[send-to-client API] ❌ Missing clientId")
      return NextResponse.json(
        { error: "Client ID is required", details: "clientId field is missing from request" },
        { status: 400 },
      )
    }

    if (!programData) {
      console.log("[send-to-client API] ❌ Missing programData")
      return NextResponse.json(
        { error: "Program data is required", details: "programData field is missing from request" },
        { status: 400 },
      )
    }

    // Log the program data structure for debugging
    console.log("[send-to-client API] Program data structure:", {
      hasWeeks: !!programData.weeks,
      weeksLength: programData.weeks?.length,
      hasRoutines: !!programData.routines,
      routinesLength: programData.routines?.length,
      programTitle: programData.program_title || programData.title || programData.name,
    })

    // Validate program data structure
    if (programData.weeks && Array.isArray(programData.weeks)) {
      console.log("[send-to-client API] Validating periodized program structure...")
      for (let i = 0; i < programData.weeks.length; i++) {
        const week = programData.weeks[i]
        if (!week.routines || !Array.isArray(week.routines)) {
          console.log(`[send-to-client API] ❌ Week ${i + 1} has invalid routines structure`)
          return NextResponse.json(
            { error: "Invalid program structure", details: `Week ${i + 1} routines must be an array` },
            { status: 400 },
          )
        }

        for (let j = 0; j < week.routines.length; j++) {
          const routine = week.routines[j]
          if (!routine.exercises || !Array.isArray(routine.exercises)) {
            console.log(`[send-to-client API] ❌ Week ${i + 1}, Routine ${j + 1} has invalid exercises structure`)
            return NextResponse.json(
              {
                error: "Invalid program structure",
                details: `Week ${i + 1}, Routine ${j + 1} exercises must be an array`,
              },
              { status: 400 },
            )
          }
        }
      }
    } else if (programData.routines && Array.isArray(programData.routines)) {
      console.log("[send-to-client API] Validating non-periodized program structure...")
      for (let i = 0; i < programData.routines.length; i++) {
        const routine = programData.routines[i]
        if (!routine.exercises || !Array.isArray(routine.exercises)) {
          console.log(`[send-to-client API] ❌ Routine ${i + 1} has invalid exercises structure`)
          return NextResponse.json(
            { error: "Invalid program structure", details: `Routine ${i + 1} exercises must be an array` },
            { status: 400 },
          )
        }
      }
    } else {
      console.log("[send-to-client API] ❌ Program has no valid weeks or routines structure")
      return NextResponse.json(
        { error: "Invalid program structure", details: "Program must have either weeks array or routines array" },
        { status: 400 },
      )
    }

    console.log("[send-to-client API] ✅ Program structure validation passed")
    console.log("[send-to-client API] Calling programConversionService.sendProgramToClient...")

    // Call the service method
    const result = await programConversionService.sendProgramToClient(trainerId, clientId, programData, customMessage)

    console.log("[send-to-client API] ✅ Program sent successfully:", result)

    return NextResponse.json({
      success: true,
      message: "Program sent to client successfully",
      data: result,
    })
  } catch (error) {
    console.error("[send-to-client API] ❌ Error sending program to client:", error)

    // Provide detailed error information
    const errorDetails = {
      message: error.message,
      stack: error.stack?.substring(0, 1000), // Limit stack trace length
      name: error.name,
    }

    return NextResponse.json(
      {
        error: "Failed to send program to client",
        details: errorDetails,
      },
      { status: 500 },
    )
  }
}
