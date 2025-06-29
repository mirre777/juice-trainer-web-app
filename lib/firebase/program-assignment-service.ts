import { getFirebaseAdminFirestore, db } from "@/lib/firebase/firebase-admin"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import type { WorkoutProgram, Client } from "@/types/workout-program"

export interface ProgramAssignment {
  id: string
  clientId: string
  clientName: string
  programData: any
  assignedAt: any
  assignedBy: string
  status: "assigned" | "in_progress" | "completed"
}

export const assignProgramToClient = async (trainerId: string, clientId: string, programData: WorkoutProgram) => {
  try {
    const firebaseDb = getFirebaseAdminFirestore()

    // Create a new program document in the trainer's programs collection
    const programRef = firebaseDb.collection(`trainers/${trainerId}/programs`).doc()
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
    await firebaseDb.collection(`trainers/${trainerId}/clients/${clientId}/assignedPrograms`).doc(programId).set({
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

export const assignProgramToClientService = async (trainerId: string, client: Client, programData: any) => {
  try {
    console.log("[Service] Assigning program to client:", { clientId: client.id, trainerId })

    const assignmentId = `${client.id}_${Date.now()}`
    const assignmentRef = doc(db, `users/${trainerId}/program_assignments`, assignmentId)

    const assignment: ProgramAssignment = {
      id: assignmentId,
      clientId: client.id,
      clientName: client.name,
      programData,
      assignedAt: serverTimestamp(),
      assignedBy: trainerId,
      status: "assigned",
    }

    await setDoc(assignmentRef, assignment)

    console.log("[Service] Program assigned successfully to client:", client.name)
  } catch (error) {
    console.error("[Service] Error assigning program to client:", error)
    throw new Error("Failed to assign program to client")
  }
}

export const unassignProgramFromClient = async (trainerId: string, clientId: string, programId: string) => {
  try {
    const firebaseDb = getFirebaseAdminFirestore()

    // Remove from client's assigned programs
    await firebaseDb.collection(`users/${trainerId}/clients/${clientId}/assignedPrograms`).doc(programId).delete()

    // Update program's assigned clients list
    const programRef = firebaseDb.collection(`users/${trainerId}/programs`).doc(programId)
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
    const firebaseDb = getFirebaseAdminFirestore()

    const snapshot = await firebaseDb.collection(`users/${trainerId}/clients/${clientId}/assignedPrograms`).get()
    const programIds = snapshot.docs.map((doc) => doc.data().programId)

    if (programIds.length === 0) {
      return { success: true, data: [] }
    }

    // Get the actual program data
    const programs = []
    for (const programId of programIds) {
      const programDoc = await firebaseDb.collection(`users/${trainerId}/programs`).doc(programId).get()
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
