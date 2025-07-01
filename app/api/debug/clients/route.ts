export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    console.log("🔍 [DEBUG] Starting comprehensive client analysis")

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
    const { collection, getDocs, doc, getDoc } = await import("firebase/firestore")

    console.log("📊 [DEBUG] Testing Firebase connection...")

    // Test 1: Check if user document exists
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)
    const userExists = userDoc.exists()
    const userData = userExists ? userDoc.data() : null

    console.log("👤 [DEBUG] User document exists:", userExists)
    if (userData) {
      console.log("👤 [DEBUG] User data keys:", Object.keys(userData))
    }

    // Test 2: Check collection path and structure
    const collectionPath = `users/${userId}/clients`
    console.log("📍 [DEBUG] Collection path:", collectionPath)

    const clientsRef = collection(db, "users", userId, "clients")
    const snapshot = await getDocs(clientsRef)

    console.log(`📈 [DEBUG] Raw query results:`)
    console.log(`  - Document count: ${snapshot.size}`)
    console.log(`  - Empty: ${snapshot.empty}`)
    console.log(`  - From cache: ${snapshot.metadata.fromCache}`)
    console.log(`  - Has pending writes: ${snapshot.metadata.hasPendingWrites}`)

    // Test 3: Analyze each document in detail
    const documentAnalysis: any[] = []
    let docIndex = 0

    snapshot.forEach((doc) => {
      docIndex++
      const data = doc.data()

      const analysis = {
        index: docIndex,
        documentId: doc.id,
        exists: doc.exists(),
        dataKeys: Object.keys(data),
        rawData: data,
        validation: {
          hasName: !!data.name,
          nameValue: data.name,
          nameType: typeof data.name,
          nameLength: data.name?.length || 0,
          nameTrimmed: data.name?.trim?.(),
          nameAfterTrim: data.name?.trim?.() || "",
          nameAfterTrimLength: data.name?.trim?.()?.length || 0,
          isValidName: data.name && typeof data.name === "string" && data.name.trim() !== "",
          hasEmail: !!data.email,
          emailValue: data.email,
          status: data.status,
        },
      }

      documentAnalysis.push(analysis)

      console.log(`📄 [DEBUG] Document ${docIndex}:`, {
        id: doc.id,
        name: data.name,
        isValid: analysis.validation.isValidName,
        keys: Object.keys(data).slice(0, 10), // First 10 keys
      })
    })

    // Test 4: Try different collection paths to see if data exists elsewhere
    const alternativePaths = [
      `trainers/${userId}/clients`,
      `clients/${userId}`,
      `user/${userId}/clients`, // typo check
    ]

    const alternativeResults: any[] = []

    for (const altPath of alternativePaths) {
      try {
        const pathParts = altPath.split("/")
        const altRef = collection(db, ...pathParts)
        const altSnapshot = await getDocs(altRef)

        alternativeResults.push({
          path: altPath,
          documentCount: altSnapshot.size,
          exists: !altSnapshot.empty,
        })

        console.log(`🔍 [DEBUG] Alternative path ${altPath}: ${altSnapshot.size} documents`)
      } catch (altError) {
        alternativeResults.push({
          path: altPath,
          error: altError.message,
        })
        console.log(`❌ [DEBUG] Alternative path ${altPath} failed:`, altError.message)
      }
    }

    // Test 5: Check if there are any collections under the user document
    const userCollections: string[] = []
    try {
      // This would require admin SDK, so we'll skip for now
      console.log("📁 [DEBUG] Skipping subcollection enumeration (requires admin SDK)")
    } catch (error) {
      console.log("📁 [DEBUG] Could not enumerate subcollections:", error)
    }

    // Test 6: Test the client service directly
    let serviceResult: any = null
    let serviceError: any = null
    try {
      const { fetchClients } = await import("@/lib/firebase/client-service")
      serviceResult = await fetchClients(userId)
      console.log("🔧 [DEBUG] Client service result:", {
        success: serviceResult.success,
        clientCount: serviceResult.clients?.length || 0,
        hasError: !!serviceResult.error,
      })
    } catch (error) {
      serviceError = error.message
      console.error("🔧 [DEBUG] Client service error:", error)
    }

    const debugReport = {
      userId,
      userDocument: {
        exists: userExists,
        dataKeys: userData ? Object.keys(userData) : [],
      },
      collection: {
        path: collectionPath,
        documentCount: snapshot.size,
        isEmpty: snapshot.empty,
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
      },
      documents: documentAnalysis,
      alternativePaths: alternativeResults,
      clientService: {
        result: serviceResult,
        error: serviceError,
      },
      summary: {
        totalDocuments: snapshot.size,
        validDocuments: documentAnalysis.filter((d) => d.validation.isValidName).length,
        invalidDocuments: documentAnalysis.filter((d) => !d.validation.isValidName).length,
      },
      timestamp: new Date().toISOString(),
    }

    console.log("🎯 [DEBUG] Complete analysis:", debugReport.summary)

    return NextResponse.json({
      success: true,
      debug: debugReport,
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
