import { NextRequest, NextResponse } from "next/server"
import { getGlobalProgram } from "@/lib/firebase/global-programs"
import { ProgramWithRoutines } from "@/lib/firebase/global-programs/types"
import { convertTimestampsToISO } from "@/lib/utils/date-utils"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Program ID is required" },
        { status: 400 }
      )
    }

    console.log("🔍 [PROGRAM API] Fetching program:", id)

    // Fetch program from sheets_imports collection
    const program: ProgramWithRoutines | null = await getGlobalProgram(id)

    if (!program) {
      return NextResponse.json(
        { success: false, error: "Program not found" },
        { status: 404 }
      )
    }


    console.log("✅ [PROGRAM API] Program fetched successfully")

    return NextResponse.json({
      success: true,
      program: convertTimestampsToISO(program)
    })

  } catch (error) {
    console.error("❌ [PROGRAM API] Error fetching program:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch program" },
      { status: 500 }
    )
  }
}
