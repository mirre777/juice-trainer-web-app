import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { notFound } from "next/navigation"
import ReviewProgramClient from "./review-program-client"
import PeriodizedReviewClient from "./periodized-review-client"

interface PageProps {
  params: {
    id: string
  }
}

export default async function ReviewProgramPage({ params }: PageProps) {
  try {
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

    // Use appropriate component based on periodization
    if (isPeriodized) {
      return <PeriodizedReviewClient importData={importData} programData={importData.program} />
    } else {
      return <ReviewProgramClient importData={importData} programData={importData.program} />
    }
  } catch (error) {
    console.error("Error fetching import data:", error)
    notFound()
  }
}
