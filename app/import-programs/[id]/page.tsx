import { notFound } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import ReviewProgramClient from "./review-program-client"
import { fetchClients } from "@/lib/firebase/client-service"

interface ImportData {
  id: string
  name: string
  program: any
  status: string
  createdAt: any
  updatedAt: any
  userId: string
  spreadsheetId?: string
  sheetsUrl?: string
}

async function getImportData(id: string): Promise<ImportData | null> {
  console.log(`[getImportData] Fetching import data for ID: ${id}`)

  try {
    // Try the trainer's sheets-imports collection first
    const trainerId = "5tVdK6LXCifZgjxD7rml3nEOXmh1" // This should come from auth context

    console.log(`[getImportData] Trying trainer path: users/${trainerId}/sheets-imports/${id}`)
    let docRef = doc(db, "users", trainerId, "sheets-imports", id)
    let docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data()
      console.log(`[getImportData] Found document in trainer collection:`, {
        id: docSnap.id,
        name: data.name,
        hasProgram: !!data.program,
        status: data.status,
        programTitle: data.program?.program_title || data.program?.title || data.program?.name,
      })

      return {
        id: docSnap.id,
        ...data,
      } as ImportData
    }

    // Try the global sheets_imports collection as fallback
    console.log(`[getImportData] Trying global path: sheets_imports/${id}`)
    docRef = doc(db, "sheets_imports", id)
    docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data()
      console.log(`[getImportData] Found document in global collection:`, {
        id: docSnap.id,
        name: data.name,
        hasProgram: !!data.program,
        status: data.status,
        programTitle: data.program?.program_title || data.program?.title || data.program?.name,
      })

      return {
        id: docSnap.id,
        ...data,
      } as ImportData
    }

    console.log(`[getImportData] Document not found in either location`)
    return null
  } catch (error) {
    console.error(`[getImportData] Error fetching import data:`, error)
    return null
  }
}

async function getClients(): Promise<any[]> {
  try {
    const trainerId = "5tVdK6LXCifZgjxD7rml3nEOXmh1" // This should come from auth context
    console.log(`[getClients] Fetching clients for trainer: ${trainerId}`)

    const clients = await fetchClients(trainerId)
    console.log(`[getClients] Fetched ${clients.length} clients`)

    // Filter to only active clients with linked accounts for program sending
    const eligibleClients = clients.filter(
      (client) => client.status === "Active" && client.userId && client.hasLinkedAccount,
    )

    console.log(`[getClients] ${eligibleClients.length} eligible clients for program sending`)

    return eligibleClients.map((client) => ({
      id: client.id,
      name: client.name,
      email: client.email || "",
      status: client.status,
      initials: client.initials || client.name?.charAt(0) || "?",
    }))
  } catch (error) {
    console.error(`[getClients] Error fetching clients:`, error)
    return []
  }
}

export default async function ReviewProgramPage({ params }: { params: { id: string } }) {
  console.log(`[ReviewProgramPage] Loading page for import ID: ${params.id}`)

  // Fetch import data and clients in parallel
  const [importData, clients] = await Promise.all([getImportData(params.id), getClients()])

  if (!importData) {
    console.log(`[ReviewProgramPage] Import data not found, showing 404`)
    notFound()
  }

  console.log(`[ReviewProgramPage] Rendering page with:`, {
    importId: importData.id,
    importName: importData.name,
    hasProgram: !!importData.program,
    clientsCount: clients.length,
    programStructure: {
      hasWeeks: !!importData.program?.weeks,
      hasRoutines: !!importData.program?.routines,
      weeksLength: importData.program?.weeks?.length,
      routinesLength: importData.program?.routines?.length,
    },
  })

  return <ReviewProgramClient importData={importData} importId={params.id} initialClients={clients} />
}
