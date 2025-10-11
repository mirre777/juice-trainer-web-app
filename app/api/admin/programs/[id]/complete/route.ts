import { getModelResponse, ModelResponseFormat } from "@/lib/ai/openai"
import { completeProgram, getImportSheetProgramById } from "@/lib/firebase/program"
import { getUserIdFromCookie } from "@/lib/utils/user"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const { id } = await params
    console.log("trying to enrich program with id", id)

    const userId = await getUserIdFromCookie()
    // get from request body, trainerId
    const { programId } = await request.json()

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const importSheet = await getImportSheetProgramById(userId, programId)

    if (!importSheet) {
        return NextResponse.json({ error: "Program not found" }, { status: 404 })
    }
    const program = await completeProgram(userId, importSheet.program)

    // read muscleGroup from body
    const { exerciseNames } = await request.json()
    console.log("trying to recognize muscle groups for", exerciseNames)

    try {

      const response = await getModelResponse(exerciseNames, ModelResponseFormat.JSON)
      const responseJson = JSON.parse(response)
      return NextResponse.json({ message: "Program detection completed successfully", responseJson })
    } catch (error) {
      console.error("Error detecting muscle groups:", error)
      return NextResponse.json({ error: "Failed to detect program" }, { status: 500 })
    }
  }