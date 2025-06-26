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

export async function sendProgramToClient(prevState: any, formData: FormData) {
  // Placeholder implementation for sendProgramToClient
  // You'll need to fill in the actual logic here based on your application's requirements.
  // For example, this might involve updating a program assignment, sending a notification, etc.
  console.log("sendProgramToClient action called with formData:", formData)
  return { message: "Program sent to client successfully (placeholder)." }
}
