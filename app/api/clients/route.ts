import { type NextRequest, NextResponse } from "next/server"
import { getFirebaseAdminAuth, getFirebaseAdminFirestore } from "@/lib/firebase/firebase-admin"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    console.log("🚀 Starting /api/clients request")

    const { searchParams } = new URL(request.url)
    const requestedTrainerId = searchParams.get("trainerId")

    // Get session cookie to verify the user
    const sessionCookie = cookies().get("session")?.value

    if (!sessionCookie) {
      console.log("❌ No session cookie found")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Verify the session cookie
    const decodedClaims = await getFirebaseAdminAuth().verifySessionCookie(sessionCookie, true)
    const authenticatedUserId = decodedClaims.uid

    console.log("🆔 Authenticated user ID:", authenticatedUserId)
    console.log("🎯 Requested trainer ID:", requestedTrainerId)

    // Use the authenticated user ID as the trainer ID
    const trainerId = requestedTrainerId || authenticatedUserId

    if (!trainerId) {
      console.log("❌ No trainer ID available")
      return NextResponse.json({ error: "Trainer ID required" }, { status: 400 })
    }

    // Ensure the authenticated user can only access their own clients
    if (requestedTrainerId && requestedTrainerId !== authenticatedUserId) {
      console.log("❌ Unauthorized access attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const db = getFirebaseAdminFirestore()
    console.log("🔍 Querying clients for trainer:", trainerId)

    // Query the trainer's clients subcollection
    const clientsSnapshot = await db.collection(`users/${trainerId}/clients`).get()

    console.log("✅ Clients query completed, found:", clientsSnapshot.size, "clients")

    const clients: any[] = []
    clientsSnapshot.forEach((doc) => {
      const data = doc.data()
      // Only include active clients (not deleted)
      if (data.status !== "Deleted") {
        clients.push({
          id: doc.id,
          name: data.name || "Unnamed Client",
          email: data.email || "",
          status: data.status || "Pending",
          initials: data.name
            ? data.name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
                .substring(0, 2)
            : "UC",
          ...data,
        })
      }
    })

    console.log("📤 Sending clients response:", clients.length, "clients")
    return NextResponse.json({ clients })
  } catch (error: any) {
    console.error("💥 Error in /api/clients:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}
