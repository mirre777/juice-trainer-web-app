import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchClients } from "@/lib/firebase/client-service"
import { db } from "@/lib/firebase/firebase"
import { collection, getDocs } from "firebase/firestore"

export async function GET(request: NextRequest) {
  try {
    console.log("[DEBUG] Starting client debug endpoint...")

    // Get user ID from cookie
    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "No user ID found in cookies",
        },
        { status: 401 },
      )
    }

    console.log("[DEBUG] User ID from cookie:", userId)

    // Get raw documents from Firestore
    const collectionPath = `users/${userId}/clients`
    console.log("[DEBUG] Collection path:", collectionPath)

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
        validationDetails: getValidationDetails(data),
      })
    })

    // Get clients via service
    const serviceResult = await fetchClients(userId)
    const serviceClients = serviceResult.success ? serviceResult.clients : []

    console.log("[DEBUG] Raw documents:", rawDocuments.length)
    console.log("[DEBUG] Service clients:", serviceClients.length)

    return NextResponse.json({
      success: true,
      debug: {
        userId,
        collectionPath,
        rawDocumentCount: rawDocuments.length,
        serviceClientCount: serviceClients.length,
        rawDocuments: rawDocuments.slice(0, 3), // First 3 for debugging
        serviceClients: serviceClients.slice(0, 3), // First 3 for debugging
        validationResults,
        validDocuments: validationResults.filter((r) => r.isValid).length,
        invalidDocuments: validationResults.filter((r) => !r.isValid).length,
      },
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

// Helper function to validate client data
function isValidClientData(data: any): boolean {
  if (!data || typeof data !== "object") return false
  if (!data.name || typeof data.name !== "string") return false
  if (!data.email || typeof data.email !== "string") return false
  return true
}

// Helper function to get detailed validation info
function getValidationDetails(data: any) {
  const details = {
    hasData: !!data,
    isObject: typeof data === "object",
    hasName: !!data?.name,
    nameType: typeof data?.name,
    hasEmail: !!data?.email,
    emailType: typeof data?.email,
    allFields: data ? Object.keys(data) : [],
  }
  return details
}
