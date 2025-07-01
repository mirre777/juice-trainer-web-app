export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    console.log("🚀 [API] Starting /api/clients request")
    console.log("🚀 [API] Runtime:", process.env.VERCEL_REGION || "local")
    console.log("🚀 [API] Node version:", process.version)

    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value
    console.log("🆔 [API] User ID from cookie:", userId)

    if (!userId) {
      console.log("❌ [API] No user_id in cookies")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log("📊 [API] Attempting to import Firebase...")

    // Test Firebase import
    let db, collection, getDocs
    try {
      const firebaseModule = await import("@/lib/firebase/firebase")
      db = firebaseModule.db
      console.log("✅ [API] Firebase db imported:", !!db)

      const firestoreModule = await import("firebase/firestore")
      collection = firestoreModule.collection
      getDocs = firestoreModule.getDocs
      console.log("✅ [API] Firestore functions imported")
    } catch (importError) {
      console.error("❌ [API] Firebase import failed:", importError)
      return NextResponse.json(
        {
          success: false,
          error: "Firebase import failed",
          details: importError.message,
        },
        { status: 500 },
      )
    }

    if (!db) {
      console.error("❌ [API] Firebase db is null/undefined")
      return NextResponse.json(
        {
          success: false,
          error: "Firebase database not available",
        },
        { status: 500 },
      )
    }

    console.log("📊 [API] Creating collection reference...")
    const collectionPath = `users/${userId}/clients`
    console.log("📍 [API] Collection path:", collectionPath)

    let clientsRef, snapshot
    try {
      clientsRef = collection(db, "users", userId, "clients")
      console.log("✅ [API] Collection reference created")

      console.log("📊 [API] Executing getDocs query...")
      snapshot = await getDocs(clientsRef)
      console.log("✅ [API] Query executed successfully")
    } catch (queryError) {
      console.error("❌ [API] Query failed:", queryError)
      return NextResponse.json(
        {
          success: false,
          error: "Firestore query failed",
          details: queryError.message,
        },
        { status: 500 },
      )
    }

    console.log(`📈 [API] Found ${snapshot.size} documents`)
    console.log(`📈 [API] Snapshot empty:`, snapshot.empty)
    console.log(`📈 [API] Snapshot metadata:`, {
      hasPendingWrites: snapshot.metadata.hasPendingWrites,
      fromCache: snapshot.metadata.fromCache,
    })

    const clients: any[] = []
    let processedCount = 0
    let validCount = 0
    let invalidCount = 0

    snapshot.forEach((doc) => {
      processedCount++
      const data = doc.data()

      console.log(`[API] Processing document ${processedCount}/${snapshot.size} - ID: ${doc.id}`)
      console.log(`[API] Document data:`, {
        name: data.name,
        nameType: typeof data.name,
        nameLength: data.name?.length,
        email: data.email,
        status: data.status,
        hasCreatedAt: !!data.createdAt,
        keys: Object.keys(data),
      })

      // Use the same validation as the real-time listener
      const hasValidName = data.name && typeof data.name === "string" && data.name.trim() !== ""

      if (hasValidName) {
        validCount++
        const client = {
          id: doc.id,
          name: data.name,
          email: data.email || "",
          phone: data.phone || "",
          status: data.status || "pending",
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          notes: data.notes || "",
          progress: data.progress || 0,
          sessions: data.sessions || { completed: 0, total: 0 },
          completion: data.completion || 0,
          bgColor: data.bgColor || "#f3f4f6",
          textColor: data.textColor || "#111827",
          lastWorkout: data.lastWorkout || { name: "", date: "", completion: 0 },
          metrics: data.metrics || [],
          goal: data.goal || "",
          program: data.program || "",
          inviteCode: data.inviteCode || "",
          userId: data.userId || "",
          initials: data.name
            .split(" ")
            .map((part: string) => part[0])
            .join("")
            .toUpperCase()
            .substring(0, 2),
        }

        clients.push(client)
        console.log(`[API] ✅ Added client ${validCount}: ${client.name}`)
      } else {
        invalidCount++
        console.log(`[API] ❌ Skipped invalid client ${invalidCount}: ${doc.id}`)
        console.log(`[API] ❌ Validation failed:`, {
          hasName: !!data.name,
          nameIsString: typeof data.name === "string",
          nameNotEmpty: data.name?.trim() !== "",
          actualName: data.name,
        })
      }
    })

    console.log(`📊 [API] Processing summary:`)
    console.log(`  - Total documents: ${snapshot.size}`)
    console.log(`  - Processed: ${processedCount}`)
    console.log(`  - Valid clients: ${validCount}`)
    console.log(`  - Invalid clients: ${invalidCount}`)
    console.log(`  - Final array length: ${clients.length}`)

    const response = {
      success: true,
      clients: clients,
      count: clients.length,
      debug: {
        totalDocuments: snapshot.size,
        processedCount,
        validCount,
        invalidCount,
        collectionPath,
        userId,
        timestamp: new Date().toISOString(),
      },
    }

    console.log(`✅ [API] Returning response with ${clients.length} clients`)
    return NextResponse.json(response)
  } catch (error: any) {
    console.error("💥 [API] Unexpected error:", error)
    console.error("💥 [API] Error stack:", error.stack)

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error?.message || "Unknown error",
        stack: error?.stack,
      },
      { status: 500 },
    )
  }
}
