export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    console.log("🔍 [DEBUG] Starting debug clients analysis")

    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value
    console.log("🆔 [DEBUG] User ID from cookie:", userId)

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Import Firebase directly
    const { db } = await import("@/lib/firebase/firebase")
    const { collection, getDocs } = await import("firebase/firestore")
    const { fetchClients, isValidClientData, mapClientData } = await import("@/lib/firebase/client-service")

    console.log("📊 [DEBUG] Querying Firestore directly...")

    // Get raw documents from Firestore
    const clientsRef = collection(db, "users", userId, "clients")
    const snapshot = await getDocs(clientsRef)

    console.log(`📄 [DEBUG] Found ${snapshot.size} raw documents`)

    // Analyze each document
    const rawDocuments: any[] = []
    const validationResults: any[] = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      const docInfo = {
        id: doc.id,
        data: data,
      }
      rawDocuments.push(docInfo)

      // Test validation
      const isValid = isValidClientData(data)
      const validationResult = {
        documentId: doc.id,
        isValid: isValid,
        rawData: data,
        validationDetails: {
          hasData: !!data,
          isObject: typeof data === "object",
          hasName: !!data.name,
          nameType: typeof data.name,
          nameValue: data.name,
          hasEmail: !!data.email,
          emailType: typeof data.email,
          emailValue: data.email,
          status: data.status,
          isTemporary: data.isTemporary,
          userId: data.userId,
        },
      }
      validationResults.push(validationResult)

      console.log(`📋 [DEBUG] Document ${doc.id}:`, {
        name: data.name,
        email: data.email,
        status: data.status,
        isValid: isValid,
      })
    })

    // Test the service function
    console.log("🔧 [DEBUG] Testing fetchClients service...")
    const serviceResult = await fetchClients(userId)
    console.log("📤 [DEBUG] Service result:", serviceResult)

    // Count valid vs invalid
    const validDocuments = validationResults.filter((r) => r.isValid).length
    const invalidDocuments = validationResults.filter((r) => !r.isValid).length

    const debugInfo = {
      userId: userId,
      collectionPath: `users/${userId}/clients`,
      rawDocumentCount: snapshot.size,
      serviceClientCount: serviceResult.success ? serviceResult.clients.length : 0,
      validDocuments: validDocuments,
      invalidDocuments: invalidDocuments,
      rawDocuments: rawDocuments,
      validationResults: validationResults,
      serviceResult: serviceResult,
    }

    console.log("📊 [DEBUG] Final analysis:", debugInfo)

    return NextResponse.json({
      success: true,
      debug: debugInfo,
    })
  } catch (error: any) {
    console.error("💥 [DEBUG] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
