import { type NextRequest, NextResponse } from "next/server"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

export async function GET(request: NextRequest) {
  try {
    // Use the SAME authentication method as other working routes
    const userId = request.cookies.get("user_id")?.value || request.cookies.get("userId")?.value

    if (!userId) {
      return NextResponse.json({ success: false, error: "No authentication token" }, { status: 401 })
    }

    console.log("Fetching clients for user:", userId)

    // Get ALL clients for this user - NO FILTERING
    const clientsRef = collection(db, "users", userId, "clients")
    const clientsQuery = query(clientsRef, orderBy("createdAt", "desc"))
    const clientsSnapshot = await getDocs(clientsQuery)

    const clients = clientsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    console.log(`Found ${clients.length} total clients`)

    return NextResponse.json({
      success: true,
      clients,
      clientCount: clients.length,
      totalClients: clients.length,
    })
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch clients" }, { status: 500 })
  }
}
