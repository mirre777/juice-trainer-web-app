import { collection, getDocs, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore"
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
    finalResult: isValid,
    rawData: data,
  })

  return isValid
}

// Map client data with extensive logging
export function mapClientData(id: string, data: any): Client | null {
  console.log("[mapClientData] Starting mapping for:", { id, data })

  if (!isValidClientData(data)) {
    console.error("[mapClientData] Invalid client data, skipping:", { id, data })
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

// Simplified subscription function without orderBy to avoid index issues
export function subscribeToClients(trainerUid: string, callback: (clients: Client[], error?: any) => void) {
  console.log(`[subscribeToClients] Starting subscription for trainer: ${trainerUid}`)

  if (!trainerUid) {
    console.error("[subscribeToClients] No trainer UID provided")
    callback([], new Error("No trainer UID provided"))
    return () => {}
  }

  try {
    const clientsCollectionRef = collection(db, "users", trainerUid, "clients")
    console.log(`[subscribeToClients] Collection path: users/${trainerUid}/clients`)

    // Remove orderBy to avoid index issues
    const unsubscribe = onSnapshot(
      clientsCollectionRef,
      (snapshot) => {
        console.log(`[subscribeToClients] Received snapshot with ${snapshot.size} documents`)
        console.log(`[subscribeToClients] Snapshot metadata:`, {
          hasPendingWrites: snapshot.metadata.hasPendingWrites,
          isFromCache: snapshot.metadata.fromCache,
          size: snapshot.size,
          empty: snapshot.empty,
        })

        // Log all raw documents
        const allDocs: any[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          allDocs.push({ id: doc.id, data })
          console.log(`[subscribeToClients] Raw document:`, {
            id: doc.id,
            exists: doc.exists(),
            data: data,
          })
        })

        console.log(`[subscribeToClients] All raw documents:`, allDocs)

        const clients: Client[] = []
        let processedCount = 0
        let validCount = 0
        let invalidCount = 0

        snapshot.forEach((doc) => {
          processedCount++
          const data = doc.data()
          console.log(`[subscribeToClients] Processing document ${processedCount}:`, { id: doc.id, data })

          const client = mapClientData(doc.id, data)
          if (client) {
            validCount++
            clients.push(client)
            console.log(`[subscribeToClients] ✅ Added valid client ${validCount}:`, client.name)
          } else {
            invalidCount++
            console.log(`[subscribeToClients] ❌ Skipped invalid client ${invalidCount}:`, { id: doc.id, data })
          }
        })

        console.log(`[subscribeToClients] Processing summary:`, {
          totalDocuments: snapshot.size,
          processedCount,
          validCount,
          invalidCount,
          finalClientCount: clients.length,
        })

        console.log(`[subscribeToClients] Final clients array:`, clients)
        callback(clients)
      },
      (error) => {
        console.error("[subscribeToClients] Subscription error:", error)
        callback([], error)
      },
    )

    return unsubscribe
  } catch (error) {
    console.error("[subscribeToClients] Error setting up subscription:", error)
    callback([], error)
    return () => {}
  }
}

// Simplified fetch function without orderBy
export async function fetchClients(trainerUid: string): Promise<Client[]> {
  console.log("[fetchClients] Starting fetch for trainer:", trainerUid)

  if (!trainerUid) {
    console.error("[fetchClients] No trainer UID provided")
    return []
  }

  try {
    const clientsCollectionRef = collection(db, "users", trainerUid, "clients")
    console.log("[fetchClients] Collection path:", `users/${trainerUid}/clients`)

    // Remove orderBy to avoid index issues
    const querySnapshot = await getDocs(clientsCollectionRef)

    console.log(`[fetchClients] Query successful! Found ${querySnapshot.size} documents`)
    console.log(`[fetchClients] Snapshot metadata:`, {
      hasPendingWrites: querySnapshot.metadata.hasPendingWrites,
      isFromCache: querySnapshot.metadata.fromCache,
      size: querySnapshot.size,
      empty: querySnapshot.empty,
    })

    // Log all raw documents
    const allDocs: any[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      allDocs.push({ id: doc.id, data })
      console.log(`[fetchClients] Raw document:`, {
        id: doc.id,
        exists: doc.exists(),
        data: data,
      })
    })

    console.log(`[fetchClients] All raw documents:`, allDocs)

    const clients: Client[] = []
    let processedCount = 0
    let validCount = 0
    let invalidCount = 0

    querySnapshot.forEach((doc) => {
      processedCount++
      const data = doc.data()
      console.log(`[fetchClients] Processing document ${processedCount}:`, { id: doc.id, data })

      const client = mapClientData(doc.id, data)
      if (client) {
        validCount++
        clients.push(client)
        console.log(`[fetchClients] ✅ Added valid client ${validCount}:`, client.name)
      } else {
        invalidCount++
        console.log(`[fetchClients] ❌ Skipped invalid client ${invalidCount}:`, { id: doc.id, data })
      }
    })

    console.log(`[fetchClients] Processing summary:`, {
      totalDocuments: querySnapshot.size,
      processedCount,
      validCount,
      invalidCount,
      finalClientCount: clients.length,
    })

    console.log(`[fetchClients] Final clients array:`, clients)
    return clients
  } catch (error) {
    console.error("[fetchClients] Error:", error)
    return []
  }
}

// Create a test client
export async function createTestClient(
  trainerId: string,
): Promise<{ success: boolean; clientId?: string; error?: any }> {
  try {
    console.log("[createTestClient] Creating test client for trainer:", trainerId)

    const clientData = {
      name: "Test Client " + Date.now(),
      email: "test@example.com",
      phone: "123-456-7890",
      status: "Active",
      progress: 50,
      sessions: { completed: 5, total: 10 },
      completion: 50,
      notes: "This is a test client",
      goal: "Test goal",
      program: "Test program",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const clientsCollectionRef = collection(db, "users", trainerId, "clients")
    const newClientRef = await addDoc(clientsCollectionRef, clientData)

    console.log("[createTestClient] Test client created with ID:", newClientRef.id)

    return {
      success: true,
      clientId: newClientRef.id,
    }
  } catch (error) {
    console.error("[createTestClient] Error:", error)
    return {
      success: false,
      error: error,
    }
  }
}
