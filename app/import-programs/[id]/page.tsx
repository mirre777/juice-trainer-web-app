import { notFound } from "next/navigation"
import { cookies } from "next/headers"
import ReviewProgramClient from "./review-program-client"
import { fetchClients } from "@/lib/firebase/client-service"
import { db } from "@/lib/firebase/firebase"
import { doc, getDoc } from "firebase/firestore"

interface ImportData {
  id: string
  name?: string
  program: any
  status: string
  created_at: any
  trainer_id?: string
}

interface Client {
  id: string
  name: string
  email?: string
  status?: string
  initials?: string
}

async function getImportData(id: string): Promise<ImportData | null> {
  try {
    console.log(`[getImportData] Fetching import data for ID: ${id}`)

    // Get trainer ID from cookies
    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value
    const userIdAlt = cookieStore.get("userId")?.value
    const trainerId = userId || userIdAlt

    if (!trainerId) {
      console.log("[getImportData] No trainer ID found in cookies")
      return null
    }

    console.log(`[getImportData] Using trainer ID: ${trainerId}`)

    // Fetch the actual import document from Firebase - try both possible paths
    let importDoc

    // First try the subcollection path
    const subCollectionRef = doc(db, "users", trainerId, "sheets-imports", id)
    importDoc = await getDoc(subCollectionRef)

    if (!importDoc.exists()) {
      // Try the root collection path as fallback
      const rootCollectionRef = doc(db, "sheets_imports", id)
      importDoc = await getDoc(rootCollectionRef)
    }

    if (!importDoc.exists()) {
      console.log(`[getImportData] Import document not found in either location for ID: ${id}`)
      return null
    }

    const importData = importDoc.data()
    console.log(`[getImportData] Found import data:`, {
      id: importData.id || id,
      name: importData.name,
      status: importData.status,
      hasProgram: !!importData.program,
      programKeys: importData.program ? Object.keys(importData.program) : [],
      programTitle: importData.program?.program_title || importData.program?.title || importData.program?.name,
      userId: importData.userId,
      trainer_id: importData.trainer_id,
    })

    return {
      id: importData.id || id,
      name:
        importData.name ||
        importData.program?.program_title ||
        importData.program?.title ||
        importData.program?.name ||
        "Untitled Program",
      program: importData.program || null,
      status: importData.status || "pending",
      created_at: importData.created_at || importData.createdAt || new Date(),
      trainer_id: importData.trainer_id || importData.userId || trainerId,
    }
  } catch (error) {
    console.error("[getImportData] Error fetching import data:", error)
    return null
  }
}

async function getClients(): Promise<Client[]> {
  try {
    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value
    const userIdAlt = cookieStore.get("userId")?.value
    const trainerId = userId || userIdAlt

    if (!trainerId) {
      console.log("No trainer ID found in cookies")
      return []
    }

    console.log("Fetching clients for trainer:", trainerId)
    const clients = await fetchClients(trainerId)

    // Transform clients to match expected interface
    const transformedClients: Client[] = clients.map((client) => ({
      id: client.id,
      name: client.name,
      email: client.email,
      status: client.status || "Active",
      initials: client.initials || client.name?.charAt(0) || "?",
    }))

    console.log("Server-side clients fetched:", transformedClients.length)
    return transformedClients
  } catch (error) {
    console.error("Error fetching clients server-side:", error)
    return []
  }
}

export default async function ReviewProgramPage({
  params,
}: {
  params: { id: string }
}) {
  const { id } = params

  if (!id) {
    notFound()
  }

  console.log(`[ReviewProgramPage] Loading page for import ID: ${id}`)

  // Fetch import data and clients in parallel
  const [importData, initialClients] = await Promise.all([getImportData(id), getClients()])

  if (!importData) {
    console.log(`[ReviewProgramPage] No import data found for ID: ${id}`)
    notFound()
  }

  console.log(`[ReviewProgramPage] Successfully loaded import data:`, {
    name: importData.name,
    hasProgram: !!importData.program,
    status: importData.status,
  })

  return <ReviewProgramClient importData={importData} importId={id} initialClients={initialClients} />
}
