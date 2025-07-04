import { doc, getDoc, collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { notFound } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import ReviewProgramClient from "./review-program-client"
import { cookies } from "next/headers"

interface PageProps {
  params: {
    id: string
  }
}

async function getTrainerIdFromAuth(): Promise<string | null> {
  try {
    const cookieStore = cookies()
    const authToken = cookieStore.get("auth-token")

    if (!authToken) {
      return null
    }

    // This is a simplified approach - in a real app you'd verify the JWT token
    // For now, we'll try to extract trainer ID from the token or make an API call
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/me`, {
      headers: {
        Cookie: `auth-token=${authToken.value}`,
      },
    })

    if (response.ok) {
      const userData = await response.json()
      return userData.uid || userData.id
    }

    return null
  } catch (error) {
    console.error("Error getting trainer ID:", error)
    return null
  }
}

async function fetchClientsForTrainer(trainerId: string) {
  try {
    const clientsRef = collection(db, "users", trainerId, "clients")
    const snapshot = await getDocs(clientsRef)

    const clients = snapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name || "Unnamed Client",
      email: doc.data().email || "",
      status: doc.data().status || "Active",
    }))

    return clients
  } catch (error) {
    console.error("Error fetching clients:", error)
    return []
  }
}

async function ReviewProgramContent({ params }: PageProps) {
  try {
    // Fetch program data
    const docRef = doc(db, "sheets_imports", params.id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      notFound()
    }

    const importData = {
      id: docSnap.id,
      ...docSnap.data(),
    }

    console.log("Server-side import data:", importData)

    // Check if this is a periodized program
    const isPeriodized =
      importData.program?.is_periodized ||
      importData.program?.weeks?.length > 0 ||
      importData.program?.routines?.[0]?.exercises?.[0]?.weeks?.length > 1

    console.log("Is periodized:", isPeriodized)
    console.log("Program weeks:", importData.program?.weeks)

    // Fetch client list for program assignment
    const trainerId = await getTrainerIdFromAuth()
    let clients = []

    if (trainerId) {
      clients = await fetchClientsForTrainer(trainerId)
      console.log("Server-side clients fetched:", clients.length)
    }

    // Use appropriate component based on periodization
    return <ReviewProgramClient importData={importData} initialClients={clients} />
  } catch (error) {
    console.error("Error fetching import data:", error)
    notFound()
  }
}

export default function ReviewProgramPage({ params }: PageProps) {
  return (
    <ProtectedRoute requiredRole="trainer">
      <ReviewProgramContent params={params} />
    </ProtectedRoute>
  )
}
