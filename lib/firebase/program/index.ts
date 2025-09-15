import { db } from "@/lib/firebase/firebase"
import { doc, getDoc } from "firebase/firestore"
import { ImportProgram } from "./types"

export async function getProgramById(trainerId: string, programId: string): Promise<ImportProgram | null>  {
    // Fetch the actual import document from Firebase - try both possible paths
    let importDoc

    // First try the subcollection path
    const subCollectionRef = doc(db, "users", trainerId, "sheets-imports", programId)
    importDoc = await getDoc(subCollectionRef)

    if (!importDoc.exists()) {
        console.log(`[getProgramById] Import document not found in subcollection for trainerId: ${trainerId} and programId: ${programId}`)
        // Try the root collection path as fallback
        const rootCollectionRef = doc(db, "sheets_imports", programId)
        importDoc = await getDoc(rootCollectionRef)
    }

    if (!importDoc.exists()) {
        console.log(`[getProgramById] Import document not found in root collection for programId: ${programId}`)
        return null
    }

    const importData = importDoc.data()

    if (!importData) {
        console.log(`[getImportData] Import document not found in either location for ID: ${programId}`)
        return null
    }

    console.log(`[getImportData] Found import data:`, {
      id: programId,
      name: importData.name,
      status: importData.status,
      userId: importData.userId,
    })

    // Convert Firestore Timestamp to ISO string for serialization
    const created_at = importData.createdAt || new Date()
    const created_at_string = created_at.toDate ? created_at.toDate().toISOString() : created_at.toISOString()

    return {
      id: programId,
      name: importData.name,
      program: importData.program,
      status: importData.status || "pending",
      createdAt: created_at_string,
    }
}