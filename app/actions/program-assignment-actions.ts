import { createProgramAssignment } from "@/controller/program-assignment"
import { revalidatePath } from "next/cache"

export async function CreateProgramAssignmentAction(prevState: any, formData: FormData) {
  try {
    const programId = formData.get("programId") as string
    const userId = formData.get("userId") as string

    if (!programId || !userId) {
      throw new Error("Missing programId or userId")
    }

    await createProgramAssignment(programId, userId)
    revalidatePath("/dashboard/program-assignments")
    return { message: `Assigned user to program.` }
  } catch (e: any) {
    console.log(e)
    if (e instanceof Error) {
      return { message: e.message }
    }
    return { message: "Failed to assign user to program." }
  }
}
