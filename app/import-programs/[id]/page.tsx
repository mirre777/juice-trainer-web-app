import { notFound } from "next/navigation"
import { cookies } from "next/headers"
import ReviewProgramClient from "./review-program-client"
import { fetchClients } from "@/lib/firebase/client-service"

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
    // Mock data for now - replace with actual Firebase fetch
    const mockImportData: ImportData = {
      id,
      name: "Sample Workout Program",
      program: {
        name: "Sample Workout Program",
        description: "A comprehensive workout program imported from Google Sheets",
        duration_weeks: 4,
        is_periodized: false,
        routines: [
          {
            name: "Upper Body Strength",
            exercises: [
              {
                name: "Bench Press",
                sets: 3,
                reps: "8-10",
                weight: "80% 1RM",
                rest: "2-3 minutes",
                notes: "Focus on controlled movement",
              },
              {
                name: "Pull-ups",
                sets: 3,
                reps: "6-8",
                weight: "Bodyweight",
                rest: "2 minutes",
              },
            ],
          },
          {
            name: "Lower Body Power",
            exercises: [
              {
                name: "Squats",
                sets: 4,
                reps: "5-6",
                weight: "85% 1RM",
                rest: "3 minutes",
                notes: "Explosive concentric phase",
              },
              {
                name: "Romanian Deadlifts",
                sets: 3,
                reps: "8-10",
                weight: "70% 1RM",
                rest: "2-3 minutes",
              },
            ],
          },
        ],
      },
      status: "completed",
      created_at: new Date(),
      trainer_id: "sample-trainer-id",
    }

    return mockImportData
  } catch (error) {
    console.error("Error fetching import data:", error)
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

  // Fetch import data and clients in parallel
  const [importData, initialClients] = await Promise.all([getImportData(id), getClients()])

  if (!importData) {
    notFound()
  }

  return <ReviewProgramClient importData={importData} importId={id} initialClients={initialClients} />
}
