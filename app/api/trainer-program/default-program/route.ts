import { getUserId } from "@/lib/utils/user";
import { NextRequest, NextResponse } from "next/server";
import { ProgramWithRoutines } from "@/lib/firebase/global-programs/types";
import { createDefaultProgram } from "@/lib/firebase/program";
import { convertTimestampsToISO } from "@/lib/utils/date-utils";

export async function GET  (
    request: NextRequest,
  ) {
    try {
      const trainerId = await getUserId(request);
      if (!trainerId) {
        return NextResponse.json(
          { success: false, error: "User is not authenticated" },
          { status: 401 }
        )
      }

      console.log(`🔍 [PROGRAM API] creating default program for trainer: ${trainerId}`)

      // Fetch program from sheets_imports collection
      const program: ProgramWithRoutines | null = await createDefaultProgram(trainerId)

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