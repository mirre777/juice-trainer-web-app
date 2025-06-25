import { db } from "@/lib/firebase/firebase"
import { collection, doc, setDoc, getDoc, updateDoc, deleteDoc, query, where, getDocs } from "firebase/firestore"
import type { ProgramAssignment } from "@/types/program-assignment"

const PROGRAM_ASSIGNMENTS_COLLECTION = "programAssignments"

export const createProgramAssignment = async (programAssignment: ProgramAssignment): Promise<ProgramAssignment> => {
  try {
    const programAssignmentDocRef = doc(collection(db, PROGRAM_ASSIGNMENTS_COLLECTION), programAssignment.id)

    await setDoc(programAssignmentDocRef, programAssignment)

    return programAssignment
  } catch (error: any) {
    throw new Error(`Failed to create program assignment: ${error.message}`)
  }
}

export const getProgramAssignment = async (id: string): Promise<ProgramAssignment | null> => {
  try {
    const programAssignmentDocRef = doc(db, PROGRAM_ASSIGNMENTS_COLLECTION, id)
    const docSnap = await getDoc(programAssignmentDocRef)

    if (docSnap.exists()) {
      return docSnap.data() as ProgramAssignment
    } else {
      return null
    }
  } catch (error: any) {
    throw new Error(`Failed to get program assignment: ${error.message}`)
  }
}

export const updateProgramAssignment = async (
  id: string,
  updates: Partial<ProgramAssignment>,
): Promise<ProgramAssignment | null> => {
  try {
    const programAssignmentDocRef = doc(db, PROGRAM_ASSIGNMENTS_COLLECTION, id)

    await updateDoc(programAssignmentDocRef, updates)

    const updatedProgramAssignment = await getProgramAssignment(id)
    return updatedProgramAssignment
  } catch (error: any) {
    throw new Error(`Failed to update program assignment: ${error.message}`)
  }
}

export const deleteProgramAssignment = async (id: string): Promise<void> => {
  try {
    const programAssignmentDocRef = doc(db, PROGRAM_ASSIGNMENTS_COLLECTION, id)
    await deleteDoc(programAssignmentDocRef)
  } catch (error: any) {
    throw new Error(`Failed to delete program assignment: ${error.message}`)
  }
}

export const getProgramAssignmentsByProgramId = async (programId: string): Promise<ProgramAssignment[]> => {
  try {
    const programAssignmentsCollectionRef = collection(db, PROGRAM_ASSIGNMENTS_COLLECTION)

    const q = query(programAssignmentsCollectionRef, where("programId", "==", programId))

    const querySnapshot = await getDocs(q)

    const programAssignments: ProgramAssignment[] = []
    querySnapshot.forEach((doc) => {
      programAssignments.push(doc.data() as ProgramAssignment)
    })

    return programAssignments
  } catch (error: any) {
    throw new Error(`Failed to get program assignments by programId: ${error.message}`)
  }
}

export const getProgramAssignmentsByUserId = async (userId: string): Promise<ProgramAssignment[]> => {
  try {
    const programAssignmentsCollectionRef = collection(db, PROGRAM_ASSIGNMENTS_COLLECTION)

    const q = query(programAssignmentsCollectionRef, where("userId", "==", userId))

    const querySnapshot = await getDocs(q)

    const programAssignments: ProgramAssignment[] = []
    querySnapshot.forEach((doc) => {
      programAssignments.push(doc.data() as ProgramAssignment)
    })

    return programAssignments
  } catch (error: any) {
    throw new Error(`Failed to get program assignments by userId: ${error.message}`)
  }
}
