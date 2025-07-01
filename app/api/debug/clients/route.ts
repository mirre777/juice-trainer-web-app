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
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
          debug: { userId: null },
        },
        { status: 401 },
      )
    }

    // Import Firebase functions
    const { db } = await import("@/lib/firebase/firebase")
    const { collection, getDocs } = await import("firebase/firestore")

    console.log("📊 [DEBUG] Analyzing collection for trainer:", userId)

    const collectionPath = `users/${userId}/clients`
    console.log("📍 [DEBUG] Collection path:", collectionPath)

    // Query clients collection
    const clientsRef = collection(db, "users", userId, "clients")
    const snapshot = await getDocs(clientsRef)

    console.log(`📈 [DEBUG] Raw documents found: ${snapshot.size}`)

    const rawDocuments: any[] = []
    const validationResults: any[] = []
    let validCount = 0
    let invalidCount = 0

    snapshot.forEach((doc) => {
      const data = doc.data()
      const docInfo = {
        id: doc.id,
        name: data.name,
        email: data.email,
        status: data.status,
        createdAt: data.createdAt,
        hasName: !!data.name,
        nameType: typeof data.name,
        nameLength: data.name?.length || 0,
        hasEmail: !!data.email,
        emailType: typeof data.email,
      }

      rawDocuments.push(docInfo)

      // Test validation logic
      const isValid = data.name && typeof data.name === "string" && data.name.trim() !== ""

      validationResults.push({
        documentId: doc.id,
        isValid,
        rawData: docInfo,
        validationDetails: {
          hasName: !!data.name,
          nameIsString: typeof data.name === "string",
          nameNotEmpty: data.name?.trim() !== "",
          finalResult: isValid,
        },
      })

      if (isValid) {
        validCount++
      } else {
        invalidCount++
      }

      console.log(`[DEBUG] Document ${doc.id}: ${isValid ? "VALID" : "INVALID"}`, docInfo)
    })

    // Test the actual client service
    let serviceClientCount = 0
    try {
      const { fetchClients } = await import("@/lib/firebase/client-service")
      const serviceResult = await fetchClients(userId)
      serviceClientCount = Array.isArray(serviceResult) ? serviceResult.length : serviceResult.clients?.length || 0
      console.log(`[DEBUG] Service returned: ${serviceClientCount} clients`)
    } catch (serviceError) {
      console.error("[DEBUG] Service error:", serviceError)
    }

    const debugInfo = {
      userId,
      collectionPath,
      rawDocumentCount: snapshot.size,
      validDocuments: validCount,
      invalidDocuments: invalidCount,
      serviceClientCount,
      rawDocuments: rawDocuments.slice(0, 5), // First 5 for brevity
      validationResults,
      timestamp: new Date().toISOString(),
    }

    console.log("🎯 [DEBUG] Analysis complete:", debugInfo)

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
        debug: { error: error.stack },
      },
      { status: 500 },
    )
  }
}
