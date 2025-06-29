import { getFirebaseAdminFirestore } from "./firebase-admin"
import { Timestamp } from "firebase-admin/firestore"

export interface ProgramAssignment {
  id?: string
  programId: string
  programName: string
  clientId: string
  clientName: string
  trainerId: string
  assignedAt: Timestamp
  status: "assigned" | "in_progress" | "completed"
  notes?: string
}

export async function assignProgramToClientService(
  trainerId: string,
  clientId: string,
  programData: {
    id: string
    name: string
    weeks: any[]
  },
  notes?: string,
): Promise<string> {
  try {
    const db = getFirebaseAdminFirestore()

    // Get client information
    const clientDoc = await db.collection("users").doc(trainerId).collection("clients").doc(clientId).get()
    if (!clientDoc.exists) {
      throw new Error("Client not found")
    }

    const clientData = clientDoc.data()

    // Create program assignment
    const assignment: Omit<ProgramAssignment, "id"> = {
      programId: programData.id,
      programName: programData.name,
      clientId,
      clientName: clientData?.name || "Unknown Client",
      trainerId,
      assignedAt: Timestamp.now(),
      status: "assigned",
      notes,
    }

    // Save to assignments collection
    const assignmentRef = await db.collection("program_assignments").add(assignment)

    // Also save the program data to the client's programs subcollection
    await db
      .collection("users")
      .doc(trainerId)
      .collection("clients")
      .doc(clientId)
      .collection("programs")
      .doc(assignmentRef.id)
      .set({
        ...programData,
        assignedAt: Timestamp.now(),
        assignmentId: assignmentRef.id,
        status: "assigned",
        notes,
      })

    return assignmentRef.id
  } catch (error) {
    console.error("Error assigning program to client:", error)
    throw error
  }
}
