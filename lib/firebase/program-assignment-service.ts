import { getFirebaseAdminFirestore } from "@/lib/firebase/firebase-admin"
import type { WorkoutProgram } from "@/types/workout-program"

export const assignProgramToClient = async (trainerId: string, clientId: string, programData: WorkoutProgram) => {
  try {
    const db = getFirebaseAdminFirestore()

    // Create a new program document in the trainer's programs collection
    const programRef = db.collection(`trainers/${trainerId}/programs`).doc()
    const programId = programRef.id

    // Store the program data
    await programRef.set({
      ...programData,
      id: programId,
      createdAt: new Date(),
      updatedAt: new Date(),
      assignedClients: [clientId],
    })

    // Create assignment record in client's assigned programs
    await db.collection(`trainers/${trainerId}/clients/${clientId}/assignedPrograms`).doc(programId).set({
      programId,
      assignedAt: new Date(),
      status: "active",
    })

    console.log(`Program ${programId} successfully assigned to client ${clientId}`)

    return { success: true, programId }
  } catch (error) {
    console.error("Error assigning program to client:", error)
    return { success: false, error: error }
  }
}

export const assignProgramToClientService = async (programData: any, clientId: string, trainerId: string) => {
  try {
    console.log("[Service] Assigning program to client:", { clientId, trainerId })

    const db = getFirebaseAdminFirestore()

    // Create a new program document in the trainer's programs collection
    const programRef = db.collection(`users/${trainerId}/programs`).doc()
    const programId = programRef.id

    // Store the program data with assignment info
    const programToStore = {
      ...programData,
      id: programId,
      createdAt: new Date(),
      updatedAt: new Date(),
      assignedTo: clientId,
      status: "assigned",
    }

    await programRef.set(programToStore)

    // Also create a reference in the client's assigned programs
    await db
      .collection(`users/${trainerId}/clients/${clientId}/assignedPrograms`)
      .doc(programId)
      .set({
        programId,
        assignedAt: new Date(),
        status: "active",
        programName: programData.name || "Untitled Program",
      })

    console.log(`[Service] Program ${programId} successfully assigned to client ${clientId}`)

    return {
      success: true,
      data: { programId, assignedAt: new Date() },
    }
  } catch (error) {
    console.error("[Service] Error assigning program to client:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export const unassignProgramFromClient = async (trainerId: string, clientId: string, programId: string) => {
  try {
    const db = getFirebaseAdminFirestore()

    // Remove from client's assigned programs
    await db.collection(`users/${trainerId}/clients/${clientId}/assignedPrograms`).doc(programId).delete()

    // Update program's assigned clients list
    const programRef = db.collection(`users/${trainerId}/programs`).doc(programId)
    const programDoc = await programRef.get()

    if (programDoc.exists) {
      const programData = programDoc.data()
      const assignedClients = (programData?.assignedClients || []).filter((id: string) => id !== clientId)

      await programRef.update({
        assignedClients,
        updatedAt: new Date(),
      })
    }

    return { success: true }
  } catch (error) {
    console.error("Error unassigning program from client:", error)
    return { success: false, error: error }
  }
}

export const getClientPrograms = async (trainerId: string, clientId: string) => {
  try {
    const db = getFirebaseAdminFirestore()

    const snapshot = await db.collection(`users/${trainerId}/clients/${clientId}/assignedPrograms`).get()
    const programIds = snapshot.docs.map((doc) => doc.data().programId)

    if (programIds.length === 0) {
      return { success: true, data: [] }
    }

    // Get the actual program data
    const programs = []
    for (const programId of programIds) {
      const programDoc = await db.collection(`users/${trainerId}/programs`).doc(programId).get()
      if (programDoc.exists) {
        programs.push({ id: programDoc.id, ...programDoc.data() })
      }
    }

    return { success: true, data: programs }
  } catch (error) {
    console.error("Error getting client programs:", error)
    return { success: false, error: error }
  }
}
