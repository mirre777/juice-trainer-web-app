import { createProgramAssignment as createProgramAssignmentService } from "@/lib/firebase/program-assignment-service"
import type { ProgramAssignment } from "@/types/program-assignment"
import { v4 as uuidv4 } from "uuid"

export async function createProgramAssignment(programId: string, userId: string): Promise<ProgramAssignment> {
  const newAssignment: ProgramAssignment = {
    id: uuidv4(),
    programId,
    userId,
    assignedAt: new Date().toISOString(),
  }
  return await createProgramAssignmentService(newAssignment)
}
