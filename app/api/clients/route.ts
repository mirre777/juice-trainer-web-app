import { type NextRequest, NextResponse } from "next/server"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const trainerId = searchParams.get("trainerId")

    if (!trainerId) {
      return NextResponse.json({ success: false, error: "Trainer ID is required" }, { status: 400 })
    }

    console.log("[API] Fetching clients for trainerId:", trainerId)

    // Get all clients for this trainer
    const clientsQuery = query(
      collection(db, "clients"),
      where("trainerId", "==", trainerId),
      where("status", "!=", "deleted"),
      where("status", "!=", "archived"),
    )

    const clientsSnapshot = await getDocs(clientsQuery)
    console.log("[API] Found", clientsSnapshot.size, "total clients")

    const clientsWithAuth = []

    // Check each client for linked Firebase user
    for (const clientDoc of clientsSnapshot.docs) {
      const clientData = { id: clientDoc.id, ...clientDoc.data() }

      // Skip clients without userId
      if (!clientData.userId) {
        console.log("[API] Client", clientData.name, "has no userId, skipping")
        continue
      }

      try {
        // Look up the user document
        const userDoc = await getDoc(doc(db, "users", clientData.userId))

        if (!userDoc.exists()) {
          console.log("[API] User document not found for userId:", clientData.userId)
          continue
        }

        const userData = userDoc.data()

        // Check if user has proper Firebase authentication
        const hasValidAuth =
          userData.email &&
          (userData.firebaseId || userData.uid) &&
          userData.status !== "temporary" &&
          userData.status !== "deleted" &&
          userData.hasFirebaseAuth !== false

        if (hasValidAuth) {
          console.log("[API] Client", clientData.name, "has valid Firebase auth")
          clientsWithAuth.push(clientData)
        } else {
          console.log("[API] Client", clientData.name, "does not have valid Firebase auth")
        }
      } catch (userError) {
        console.error("[API] Error checking user auth for client", clientData.name, ":", userError)
        continue
      }
    }

    console.log("[API] Returning", clientsWithAuth.length, "clients with valid auth")

    return NextResponse.json({
      success: true,
      clients: clientsWithAuth,
    })
  } catch (error) {
    console.error("[API] Error fetching clients:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch clients" }, { status: 500 })
  }
}
