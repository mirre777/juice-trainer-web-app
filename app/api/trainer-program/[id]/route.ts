import { NextRequest, NextResponse } from "next/server"
import { convertTimestampsToISO } from "@/lib/utils/date-utils"
import { getUserIdFromCookie } from "@/lib/utils/user"
import { getProgramById } from "@/lib/firebase/program"
import { ImportProgram } from "@/lib/firebase/program/types"

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
    const trainerId = await getUserIdFromCookie();
    if (!trainerId) {
      return NextResponse.json(
        { success: false, error: "User is not authenticated" },
        { status: 401 }
      )
    }

    console.log(`🔍 [PROGRAM API] Fetching program: ${id}, trainer: ${trainerId}`)

    // Fetch program from sheets_imports collection
    const program: ImportProgram | null = await getProgramById(trainerId, id)

    if (!program) {
      return NextResponse.json(
        { success: false, error: "Program not found" },
        { status: 404 }
      )
    }


    console.log("✅ [PROGRAM API] Program fetched successfully")

    return NextResponse.json(convertTimestampsToISO(program))

  } catch (error) {
    console.error("❌ [PROGRAM API] Error fetching program:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch program" },
      { status: 500 }
    )
  }
}
