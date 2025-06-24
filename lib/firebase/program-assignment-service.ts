import { getFirebaseAdminFirestore } from "@/lib/firebase/firebase-admin"
import type { WorkoutProgram } from "@/types/workout-program" // Import the type

export const assignProgramToClient = async (
  trainerId: string,
  clientId: string,
  programData: WorkoutProgram, // Corrected: now accepts the full program data
) => {
  try {
    const firestore = getFirebaseAdminFirestore()

    // Reference to the client's assignedPrograms subcollection
    const assignedProgramsCollectionRef = firestore
      .collection("users")
      .doc(trainerId)
      .collection("clients")
      .doc(clientId)
      .collection("assignedPrograms")

    // Add the program data as a new document in the subcollection
    const newProgramRef = await assignedProgramsCollectionRef.add({
      ...programData, // Store the entire program object
      assignedAt: firestore.FieldValue.serverTimestamp(), // Use server timestamp
      trainerId: trainerId, // Redundant but good for queries
      clientId: clientId, // Redundant but good for queries
    })

    // Also update the client's main document to point to the latest assigned program
    // This is optional, but useful for quick lookup of the current program
    const clientRef = firestore.collection("users").doc(trainerId).collection("clients").doc(clientId)
    await clientRef.update({
      currentProgramId: newProgramRef.id, // Store the ID of the newly assigned program
      currentProgramTitle: programData.program_title, // Store title for quick display
      programAssignedAt: firestore.FieldValue.serverTimestamp(),
    })

    return { success: true, programId: newProgramRef.id } // Return the ID of the newly created program document
  } catch (error: any) {
    console.error("Error assigning program to client:", error)
    return { success: false, error: error }
  }
}

export const unassignProgramFromClient = async (trainerId: string, clientId: string, programId: string) => {
  try {
    const firestore = getFirebaseAdminFirestore()
    await firestore
      .collection("users")
      .doc(trainerId)
      .collection("clients")
      .doc(clientId)
      .collection("assignedPrograms")
      .doc(programId)
      .delete()

    // Optionally clear currentProgramId from client's main document
    const clientRef = firestore.collection("users").doc(trainerId).collection("clients").doc(clientId)
    await clientRef.update({
      currentProgramId: firestore.FieldValue.delete(), // Remove the field
      currentProgramTitle: firestore.FieldValue.delete(),
      programAssignedAt: firestore.FieldValue.delete(),
    })

    return { success: true }
  } catch (error) {
    console.error("Error unassigning program from client:", error)
    return { success: false, error: error }
  }
}

export const getClientPrograms = async (trainerId: string, clientId: string) => {
  try {
    const firestore = getFirebaseAdminFirestore()
    const snapshot = await firestore
      .collection("users")
      .doc(trainerId)
      .collection("clients")
      .doc(clientId)
      .collection("assignedPrograms")
      .orderBy("assignedAt", "desc")
      .get()
    const programs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    return { success: true, data: programs }
  } catch (error) {
    console.error("Error getting client programs:", error)
    return { success: false, error: error }
  }
}
