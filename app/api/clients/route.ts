import { type NextRequest, NextResponse } from "next/server"
import { collection, doc, getDoc, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import type { Client } from "@/types/client"

// Helper function to get initials from name
function getInitials(name: string): string {
  if (!name || typeof name !== "string") return "UC"
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)
}

// Map client data with proper typing
function mapClientData(id: string, data: any): Client {
  return {
    id,
    name: data.name || "Unknown",
    email: data.email || "",
    phone: data.phone || "",
    status: data.status || "pending",
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    notes: data.notes || "",
    goals: data.goals || [],
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
    initials: getInitials(data.name || "UC"),
    _lastUpdated: Date.now(),
  }
}

// Check if a user has proper Firebase authentication
async function checkUserHasFirebaseAuth(userId: string): Promise<boolean> {
  try {
    if (!userId) return false

    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      console.log(`[checkUserHasFirebaseAuth] User ${userId} does not exist`)
      return false
    }

    const userData = userDoc.data()

    // Check if user has proper Firebase auth fields
    const hasEmail = userData.email && typeof userData.email === "string" && userData.email.length > 0
    const hasFirebaseId = userData.firebaseId || userData.uid
    const isNotTemporary = userData.isTemporary !== true
    const hasValidStatus = userData.status !== "deleted" && userData.status !== "rejected"

    console.log(
      `[checkUserHasFirebaseAuth] User ${userId}: email=${!!hasEmail}, firebaseId=${!!hasFirebaseId}, notTemporary=${isNotTemporary}, validStatus=${hasValidStatus}`,
    )

    return hasEmail && hasFirebaseId && isNotTemporary && hasValidStatus
  } catch (error) {
    console.error(`[checkUserHasFirebaseAuth] Error checking user ${userId}:`, error)
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const trainerId = searchParams.get("trainerId")

    console.log("[API /clients] Request received with trainerId:", trainerId)

    if (!trainerId) {
      console.log("[API /clients] No trainerId provided")
      return NextResponse.json({ success: false, error: "Trainer ID is required" }, { status: 400 })
    }

    console.log("[API /clients] Fetching clients from Firestore...")

    // Get all clients for this trainer
    const clientsRef = collection(db, "users", trainerId, "clients")
    const clientsSnapshot = await getDocs(clientsRef)

    console.log(`[API /clients] Found ${clientsSnapshot.size} client documents`)

    const allClients: Client[] = []
    const clientsWithAuth: Client[] = []

    // Process each client document
    for (const clientDoc of clientsSnapshot.docs) {
      const clientData = clientDoc.data()
      console.log(`[API /clients] Processing client ${clientDoc.id}:`, {
        name: clientData.name,
        status: clientData.status,
        userId: clientData.userId,
        isTemporary: clientData.isTemporary,
      })

      // Skip if client data is invalid
      if (!clientData || !clientData.name) {
        console.log(`[API /clients] Skipping client ${clientDoc.id} - invalid data`)
        continue
      }

      // Skip if client is deleted/archived
      if (
        clientData.status === "deleted" ||
        clientData.status === "archived" ||
        clientData.status === "Deleted" ||
        clientData.status === "Archived"
      ) {
        console.log(`[API /clients] Skipping client ${clientDoc.id} - deleted/archived status`)
        continue
      }

      const client = mapClientData(clientDoc.id, clientData)
      allClients.push(client)

      // Check if client has a linked Firebase user account
      if (clientData.userId) {
        console.log(`[API /clients] Checking Firebase auth for user ${clientData.userId}`)
        const hasAuth = await checkUserHasFirebaseAuth(clientData.userId)

        if (hasAuth) {
          console.log(`[API /clients] Client ${client.name} has valid Firebase auth`)
          clientsWithAuth.push(client)
        } else {
          console.log(`[API /clients] Client ${client.name} does not have valid Firebase auth`)
        }
      } else {
        console.log(`[API /clients] Client ${client.name} has no userId - not linked to Firebase account`)
      }
    }

    console.log(`[API /clients] Total clients: ${allClients.length}, Clients with auth: ${clientsWithAuth.length}`)

    return NextResponse.json({
      success: true,
      clients: clientsWithAuth,
      totalClients: allClients.length,
      activeLinkedClients: clientsWithAuth.length,
    })
  } catch (error) {
    console.error("[API /clients] Error fetching clients:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch clients",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
