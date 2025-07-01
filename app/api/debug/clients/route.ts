import { type NextRequest, NextResponse } from "next/server"
import { fetchClients } from "@/lib/firebase/client-service"
import { db } from "@/lib/firebase/firebase"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get("user_id")?.value

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "No user ID found in cookies",
        },
        { status: 401 },
      )
    }

    console.log("[DEBUG] Starting debug analysis for user:", userId)

    // Get raw documents from Firestore
    const collectionPath = `users/${userId}/clients`
    const clientsRef = collection(db, collectionPath)
    const snapshot = await getDocs(clientsRef)

    const rawDocuments = []
    const validationResults = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      rawDocuments.push({
        id: doc.id,
        ...data,
      })

      // Test validation on each document
      const isValid = isValidClientData(data)
      validationResults.push({
        documentId: doc.id,
        isValid,
        rawData: data,
        validationDetails: {
          hasName: !!data.name,
          hasEmail: !!data.email,
          hasStatus: !!data.status,
          hasCreatedAt: !!data.createdAt,
          nameType: typeof data.name,
          emailType: typeof data.email,
          statusType: typeof data.status,
          createdAtType: typeof data.createdAt,
        },
      })
    })

    // Get clients using the service
    const serviceClients = await fetchClients(userId)

    // Check if user document exists
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    const debugInfo = {
      userId,
      collectionPath,
      userExists: userDoc.exists(),
      rawDocumentCount: rawDocuments.length,
      serviceClientCount: serviceClients.length,
      validDocuments: validationResults.filter((r) => r.isValid).length,
      invalidDocuments: validationResults.filter((r) => !r.isValid).length,
      rawDocuments: rawDocuments.slice(0, 3), // First 3 for debugging
      validationResults,
      serviceClients: serviceClients.slice(0, 3), // First 3 for debugging
    }

    console.log("[DEBUG] Analysis complete:", debugInfo)

    return NextResponse.json({
      success: true,
      debug: debugInfo,
    })
  } catch (error) {
    console.error("[DEBUG] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

// Simple validation function for debugging
function isValidClientData(data: any): boolean {
  return !!(
    data &&
    typeof data === "object" &&
    data.name &&
    typeof data.name === "string" &&
    data.email &&
    typeof data.email === "string"
  )
}
