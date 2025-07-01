export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { fetchClients, isValidClientData, mapClientData } from "@/lib/firebase/client-service-fixed"

export async function GET() {
  try {
    console.log("🔍 [DEBUG] Starting client debug analysis")

    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value
    console.log("🆔 [DEBUG] User ID from cookie:", userId)

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Step 1: Check if user document exists
    console.log("📋 [DEBUG] Step 1: Checking user document")
    const userDocPath = `users/${userId}`
    console.log("📍 [DEBUG] User document path:", userDocPath)

    // Step 2: Get raw documents from Firestore
    console.log("📋 [DEBUG] Step 2: Getting raw documents from Firestore")
    const clientsCollectionRef = collection(db, "users", userId, "clients")
    const rawSnapshot = await getDocs(clientsCollectionRef)

    console.log(`📊 [DEBUG] Raw Firestore query results:`)
    console.log(`  - Collection path: users/${userId}/clients`)
    console.log(`  - Document count: ${rawSnapshot.size}`)
    console.log(`  - Is empty: ${rawSnapshot.empty}`)
    console.log(`  - From cache: ${rawSnapshot.metadata.fromCache}`)

    // Collect all raw documents
    const rawDocuments: any[] = []
    rawSnapshot.forEach((doc) => {
      const data = doc.data()
      rawDocuments.push({
        id: doc.id,
        data: data,
        exists: doc.exists(),
      })
      console.log(`📄 [DEBUG] Raw document ${doc.id}:`, data)
    })

    // Step 3: Test service function
    console.log("📋 [DEBUG] Step 3: Testing service function")
    const serviceClients = await fetchClients(userId)
    console.log(`🔧 [DEBUG] Service returned ${serviceClients.length} clients`)

    // Step 4: Test validation on each raw document
    console.log("📋 [DEBUG] Step 4: Testing validation on each document")
    const validationResults: any[] = []

    rawDocuments.forEach((doc, index) => {
      console.log(`🧪 [DEBUG] Testing validation for document ${index + 1}: ${doc.id}`)

      const isValid = isValidClientData(doc.data)
      const mappedClient = isValid ? mapClientData(doc.id, doc.data) : null

      const result = {
        documentId: doc.id,
        rawData: doc.data,
        isValid: isValid,
        mappedClient: mappedClient,
        validationDetails: {
          hasData: !!doc.data,
          isObject: typeof doc.data === "object",
          hasName: !!doc.data?.name,
          nameIsString: typeof doc.data?.name === "string",
          nameNotEmpty: doc.data?.name?.trim() !== "",
        },
      }

      validationResults.push(result)
      console.log(`📊 [DEBUG] Validation result for ${doc.id}:`, result)
    })

    // Summary
    const summary = {
      userId: userId,
      userDocumentPath: userDocPath,
      collectionPath: `users/${userId}/clients`,
      rawDocumentCount: rawSnapshot.size,
      serviceClientCount: serviceClients.length,
      validDocuments: validationResults.filter((r) => r.isValid).length,
      invalidDocuments: validationResults.filter((r) => !r.isValid).length,
    }

    console.log("📊 [DEBUG] Final summary:", summary)

    return NextResponse.json({
      success: true,
      debug: {
        ...summary,
        rawDocuments: rawDocuments,
        serviceClients: serviceClients,
        validationResults: validationResults,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error("💥 [DEBUG] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unknown error",
        stack: error?.stack,
      },
      { status: 500 },
    )
  }
}
