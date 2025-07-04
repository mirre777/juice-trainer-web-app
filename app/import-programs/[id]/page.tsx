import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { notFound } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import ReviewProgramClient from "./review-program-client"
import { clientService } from "@/lib/firebase/client-service"

interface PageProps {
  params: {
    id: string
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
    let clients = []
    try {
      clients = await clientService.getClients()
      console.log("Server-side clients fetched:", clients.length)
    } catch (error) {
      console.error("Error fetching clients:", error)
      // Continue without clients - the component will handle the empty state
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
