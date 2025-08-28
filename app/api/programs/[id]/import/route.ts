//handle the import of a program

import { NextRequest, NextResponse } from "next/server"
import { getGlobalProgram } from "@/lib/firebase/global-programs"
import { cookies } from "next/headers"
import { importProgram } from "@/lib/firebase/program-import"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params
  console.log("trying to import program with id", id)

  try {
    // Get user ID from cookies (following the app's authentication pattern)
    const cookieStore = await cookies()
    const userId = cookieStore.get("user_id")?.value
    console.log("userId from cookie:", userId)

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized - No user ID found" }, { status: 401 })
    }

    // get the program from the database
    const program = await getGlobalProgram(id)
    console.log("program", program)

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 })
    }

    await importProgram(program, userId)

    return NextResponse.json({ message: "Program imported successfully", userId, programId: id })
  } catch (error) {
    console.error("Error importing program:", error)
    return NextResponse.json({ error: "Failed to import program" }, { status: 500 })
  }
}