import { collection, getDocs, onSnapshot } from "firebase/firestore"
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

// More lenient validation - only check for basic required fields
export function isValidClientData(data: any): boolean {
  const isValid =
    data && typeof data === "object" && data.name && typeof data.name === "string" && data.name.trim() !== ""

  console.log("[isValidClientData] Validating:", {
    hasData: !!data,
    isObject: typeof data === "object",
    hasName: !!data?.name,
    nameIsString: typeof data?.name === "string",
    nameNotEmpty: data?.name?.trim() !== "",
    result: isValid,
  })

  return isValid
}

// Simplified mapping with defaults for missing fields
export function mapClientData(id: string, data: any): Client | null {
  console.log("[mapClientData] Mapping client:", { id, data })

  if (!isValidClientData(data)) {
    console.error("[mapClientData] Invalid client data:", data)
    return null
  }

  const mappedClient = {
    id: id,
    name: data.name || "Unnamed Client",
    initials: getInitials(data.name || "UC"),
    status: data.status || "Pending",
    progress: data.progress || 0,
    sessions: data.sessions || { completed: 0, total: 0 },
    completion: data.completion || 0,
    notes: data.notes || "",
    bgColor: data.bgColor || "#f3f4f6",
    textColor: data.textColor || "#111827",
    lastWorkout: data.lastWorkout || { name: "", date: "", completion: 0 },
    metrics: data.metrics || [],
    email: data.email || "",
    goal: data.goal || "",
    program: data.program || "",
    createdAt: data.createdAt,
    inviteCode: data.inviteCode || "",
    userId: data.userId || "",
    phone: data.phone || "",
    _lastUpdated: Date.now(),
  } as Client

  console.log("[mapClientData] Successfully mapped client:", mappedClient)
  return mappedClient
}

// Simplified fetch function with extensive logging
export async function fetchClients(trainerUid: string): Promise<Client[]> {
  try {
    console.log("[fetchClients] Starting fetch for trainer:", trainerUid)

    if (!trainerUid) {
      console.error("[fetchClients] No trainer UID provided")
      return []
    }

    console.log("[fetchClients] Building Firestore query...")
    const clientsCollectionRef = collection(db, "users", trainerUid, "clients")
    console.log("[fetchClients] Collection path:", `users/${trainerUid}/clients`)

    // Try without orderBy first to avoid index issues
    console.log("[fetchClients] Executing query without orderBy...")
    const clientsSnapshot = await getDocs(clientsCollectionRef)

    console.log(`[fetchClients] Query successful! Found ${clientsSnapshot.size} documents`)

    if (clientsSnapshot.empty) {
      console.log("[fetchClients] No documents found in collection")
      return []
    }

    // Log all raw documents
    console.log("[fetchClients] Raw documents:")
    clientsSnapshot.forEach((doc, index) => {
      const data = doc.data()
      console.log(`[fetchClients] Document ${index + 1}:`, {
        id: doc.id,
        data: data,
      })
    })

    const clients: Client[] = []
    let processedCount = 0

    clientsSnapshot.forEach((doc) => {
      processedCount++
      const data = doc.data()
      console.log(`[fetchClients] Processing document ${processedCount}: ${doc.id}`)

      const client = mapClientData(doc.id, data)
      if (client) {
        clients.push(client)
        console.log(`[fetchClients] ✅ Added client: ${client.name}`)
      } else {
        console.log(`[fetchClients] ❌ Skipped invalid client:`, { id: doc.id, data })
      }
    })

    console.log(`[fetchClients] Final result: ${clients.length} clients`)
    return clients
  } catch (error) {
    console.error("[fetchClients] Error:", error)
    return []
  }
}

// Simplified subscription function
export function subscribeToClients(trainerUid: string, callback: (clients: Client[], error?: any) => void) {
  if (!trainerUid) {
    console.error("[subscribeToClients] No trainer UID provided")
    callback([], new Error("No trainer UID provided"))
    return () => {}
  }

  console.log(`[subscribeToClients] Setting up subscription for trainer: ${trainerUid}`)

  try {
    const clientsCollectionRef = collection(db, "users", trainerUid, "clients")
    console.log(`[subscribeToClients] Collection path: users/${trainerUid}/clients`)

    const unsubscribe = onSnapshot(
      clientsCollectionRef,
      (snapshot) => {
        console.log(`[subscribeToClients] Received update: ${snapshot.size} documents`)

        const clients: Client[] = []

        snapshot.forEach((doc) => {
          const data = doc.data()
          console.log(`[subscribeToClients] Processing document: ${doc.id}`, data)

          const client = mapClientData(doc.id, data)
          if (client) {
            clients.push(client)
            console.log(`[subscribeToClients] ✅ Added client: ${client.name}`)
          } else {
            console.log(`[subscribeToClients] ❌ Skipped invalid client:`, { id: doc.id, data })
          }
        })

        console.log(`[subscribeToClients] Final result: ${clients.length} clients`)
        callback(clients)
      },
      (error) => {
        console.error("[subscribeToClients] Subscription error:", error)
        callback([], error)
      },
    )

    return unsubscribe
  } catch (error) {
    console.error("[subscribeToClients] Setup error:", error)
    callback([], error)
    return () => {}
  }
}
