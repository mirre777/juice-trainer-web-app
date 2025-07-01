export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchClients } from "@/lib/firebase/client-service-fixed"

export async function GET() {
  try {
    console.log("🔍 [DEBUG] Starting debug clients endpoint")

    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value
    console.log("🆔 [DEBUG] User ID from cookie:", userId)

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Import Firestore functions
    const { db } = await import("@/lib/firebase/firebase")
    const { collection, getDocs, doc, getDoc } = await import("firebase/firestore")

    // Check if user document exists
    console.log("👤 [DEBUG] Checking user document...")
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    console.log("👤 [DEBUG] User document exists:", userDoc.exists())
    if (userDoc.exists()) {
      console.log("👤 [DEBUG] User data:", userDoc.data())
    }

    // Check clients collection
    console.log("📁 [DEBUG] Checking clients collection...")
    const clientsCollectionRef = collection(db, "users", userId, "clients")
    const clientsSnapshot = await getDocs(clientsCollectionRef)

    console.log("📁 [DEBUG] Clients collection size:", clientsSnapshot.size)

    const rawClients: any[] = []
    clientsSnapshot.forEach((doc) => {
      const data = doc.data()
      rawClients.push({
        id: doc.id,
        data: data,
        exists: doc.exists(),
      })
      console.log("📄 [DEBUG] Raw client document:", { id: doc.id, data })
    })

    // Also try the service function
    console.log("🔧 [DEBUG] Testing fetchClients service...")
    const serviceClients = await fetchClients(userId)
    console.log("🔧 [DEBUG] Service returned:", serviceClients.length, "clients")

    return NextResponse.json({
      success: true,
      debug: {
        userId: userId,
        userExists: userDoc.exists(),
        userData: userDoc.exists() ? userDoc.data() : null,
        collectionPath: `users/${userId}/clients`,
        rawDocumentCount: clientsSnapshot.size,
        rawDocuments: rawClients,
        serviceClientCount: serviceClients.length,
        serviceClients: serviceClients,
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
