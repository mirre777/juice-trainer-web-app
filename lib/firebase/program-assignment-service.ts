import { getFirebaseAdminFirestore } from "@/lib/firebase/firebase-admin"

export const assignProgramToClient = async (userId: string, programId: string) => {
  try {
    await getFirebaseAdminFirestore().collection("userPrograms").doc(`${userId}_${programId}`).set({
      userId,
      programId,
      assignedAt: new Date(),
    })
    return { success: true }
  } catch (error) {
    console.error("Error assigning program to user:", error)
    return { success: false, error: error }
  }
}

export const unassignProgramFromClient = async (userId: string, programId: string) => {
  try {
    await getFirebaseAdminFirestore().collection("userPrograms").doc(`${userId}_${programId}`).delete()
    return { success: true }
  } catch (error) {
    console.error("Error unassigning program from user:", error)
    return { success: false, error: error }
  }
}

export const getClientPrograms = async (userId: string) => {
  try {
    const snapshot = await getFirebaseAdminFirestore().collection("userPrograms").where("userId", "==", userId).get()
    const programs = snapshot.docs.map((doc) => doc.data())
    return { success: true, data: programs }
  } catch (error) {
    console.error("Error getting user programs:", error)
    return { success: false, error: error }
  }
}
