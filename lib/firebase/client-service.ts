import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  arrayUnion,
  Timestamp,
} from "firebase/firestore"
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

// Helper function to validate client data
export function isValidClientData(data: any): boolean {
  return data && typeof data === "object" && typeof data.name === "string" && !data.name.includes("channel?VER=")
}

// Get user data by following the userId from client document
async function getUserDataFromUserId(userId: string): Promise<any> {
  try {
    if (!userId) {
      console.log(`[getUserDataFromUserId] No userId provided`)
      return null
    }

    const userPath = `users/${userId}`
    console.log(`[getUserDataFromUserId] Following userId to path: /${userPath}`)

    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      const userData = userDoc.data()
      console.log(`[getUserDataFromUserId] Found user data:`, {
        id: userId,
        name: userData.name || "NO_NAME",
        email: userData.email || "NO_EMAIL",
        status: userData.status || "NO_STATUS",
        hasTrainers: !!(userData.trainers && userData.trainers.length > 0),
      })
      return userData
    } else {
      console.log(`[getUserDataFromUserId] User document does not exist at /${userPath}`)
      return null
    }
  } catch (error) {
    console.error(`[getUserDataFromUserId] Error getting user data for ${userId}:`, error)
    return null
  }
}

// Enhanced client data mapping that follows userId to get complete user data
export async function mapClientDataWithUserInfo(id: string, data: any): Promise<Client | null> {
  // Check for corrupted data
  if (!isValidClientData(data)) {
    console.error("Invalid client data detected:", data)
    return null
  }

  console.log(`[mapClientDataWithUserInfo] Processing client ${id}:`, {
    name: data.name,
    status: data.status,
    userId: data.userId || "NO_USER_ID",
    email: data.email || "NO_EMAIL_IN_CLIENT_DOC",
  })

  // If client has userId, follow it to get complete user data
  let userData = null
  if (data.userId) {
    userData = await getUserDataFromUserId(data.userId)
  }

  // Merge client data with user data (user data takes precedence for contact info)
  const mergedData: Client = {
    id: id,
    name: userData?.name || data.name || "Unnamed Client",
    initials: getInitials(userData?.name || data.name || "UC"),
    status: data.status || "Pending",
    progress: data.progress || 0,
    sessions: data.sessions || { completed: 0, total: 0 },
    completion: data.completion || 0,
    notes: data.notes || "",
    bgColor: data.bgColor || "#f3f4f6",
    textColor: data.textColor || "#111827",
    lastWorkout: data.lastWorkout || { name: "", date: "", completion: 0 },
    metrics: data.metrics || [],
    email: userData?.email || data.email || "",
    goal: data.goal || "",
    program: data.program || "",
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt || new Date(),
    inviteCode: data.inviteCode || "",
    userId: data.userId || "",
    phone: userData?.phone || data.phone || "",
    _lastUpdated: Date.now(),
  }

  console.log(`[mapClientDataWithUserInfo] Mapped client:`, {
    id: mergedData.id,
    name: mergedData.name,
    email: mergedData.email,
    status: mergedData.status,
    userId: mergedData.userId,
  })

  return mergedData
}

// Synchronous version for backward compatibility
export function mapClientData(id: string, data: any): Client | null {
  // Check for corrupted data
  if (!isValidClientData(data)) {
    console.error("Invalid client data detected:", data)
    return null
  }

  return {
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
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt || new Date(),
    inviteCode: data.inviteCode || "",
    userId: data.userId || "",
    phone: data.phone || "",
    _lastUpdated: Date.now(),
  } as Client
}

// Get a single client by trainer ID and client ID with enhanced error handling
export async function getClient(trainerId: string, clientId: string): Promise<Client | null> {
  try {
    console.log(`[getClient] Fetching client ${clientId} for trainer ${trainerId}`)

    if (!trainerId) {
      console.error("[getClient] No trainer ID provided")
      return null
    }

    if (!clientId) {
      console.error("[getClient] No client ID provided")
      return null
    }

    // Get client from the trainer's clients subcollection
    const clientRef = doc(db, "users", trainerId, "clients", clientId)
    const clientDoc = await getDoc(clientRef)

    if (!clientDoc.exists()) {
      console.log(`[getClient] Client ${clientId} not found for trainer ${trainerId}`)
      return null
    }

    const clientData = clientDoc.data()
    console.log(`[getClient] Found client data:`, clientData)

    // Use enhanced mapping that follows userId
    const client = await mapClientDataWithUserInfo(clientId, clientData)

    if (!client) {
      console.error(`[getClient] Failed to map client data for ${clientId}`)
      return null
    }

    console.log(`[getClient] Successfully mapped client:`, {
      id: client.id,
      name: client.name,
      status: client.status,
      email: client.email,
    })

    return client
  } catch (error) {
    console.error(`[getClient] Error fetching client ${clientId} for trainer ${trainerId}:`, error)
    return null
  }
}

// Get all clients for a specific trainer
export async function fetchClients(trainerUid: string): Promise<Client[]> {
  try {
    console.log(`[fetchClients] Starting client fetch process for trainer: ${trainerUid}`)

    if (!trainerUid) {
      console.log(`[fetchClients] No trainer UID provided`)
      return []
    }

    // Define Firestore paths
    const trainerPath = `users/${trainerUid}`
    const clientsCollectionPath = `users/${trainerUid}/clients`

    console.log(`[fetchClients] Firestore paths:`)
    console.log(`[fetchClients]   - Trainer document: /${trainerPath}`)
    console.log(`[fetchClients]   - Clients collection: /${clientsCollectionPath}`)

    // Verify trainer document exists
    const trainerRef = doc(db, "users", trainerUid)
    const trainerDoc = await getDoc(trainerRef)

    if (!trainerDoc.exists()) {
      console.log(`[fetchClients] Trainer document does not exist at /${trainerPath}`)
      return []
    }

    const trainerData = trainerDoc.data()
    console.log(`[fetchClients] Trainer document exists:`, {
      name: trainerData.name || "NO_NAME",
      email: trainerData.email || "NO_EMAIL",
    })

    // Query the clients collection
    const clientsCollectionRef = collection(db, "users", trainerUid, "clients")
    const simpleQuery = query(clientsCollectionRef)
    const simpleSnapshot = await getDocs(simpleQuery)

    console.log(`[fetchClients] Query result: ${simpleSnapshot.size} documents`)

    if (simpleSnapshot.size === 0) {
      console.log(`[fetchClients] Clients collection is empty`)
      return []
    }

    // Process each client document
    const clients: Client[] = []
    let processedCount = 0

    for (const docSnapshot of simpleSnapshot.docs) {
      processedCount++
      const clientId = docSnapshot.id
      const clientData = docSnapshot.data()

      console.log(`[fetchClients] Processing client ${processedCount}/${simpleSnapshot.size} (${clientId}):`)
      console.log(`[fetchClients]   - Name: ${clientData.name || "NO_NAME"}`)
      console.log(`[fetchClients]   - Status: ${clientData.status || "NO_STATUS"}`)

      // Use enhanced mapping that follows userId
      const client = await mapClientDataWithUserInfo(clientId, clientData)

      if (client) {
        clients.push(client)
        console.log(`[fetchClients] Added client to results:`, {
          id: client.id,
          name: client.name,
          status: client.status,
        })
      } else {
        console.log(`[fetchClients] Skipped invalid client: ${clientId}`)
      }
    }

    console.log(`[fetchClients] Processing complete. Valid clients: ${clients.length}`)
    return clients
  } catch (error) {
    console.error(`[fetchClients] Unexpected error:`, error)
    return []
  }
}

// Check for duplicate email in trainer's clients
export async function checkDuplicateEmail(
  trainerId: string,
  email: string,
): Promise<{ exists: boolean; client?: Client; error?: any }> {
  try {
    if (!trainerId || !email) {
      return { exists: false }
    }

    console.log(`[checkDuplicateEmail] Checking for duplicate email: ${email} for trainer: ${trainerId}`)

    const clientsCollectionRef = collection(db, "users", trainerId, "clients")
    const q = query(clientsCollectionRef, where("email", "==", email.toLowerCase().trim()))

    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const clientDoc = querySnapshot.docs[0]
      const clientData = clientDoc.data()
      const client = mapClientData(clientDoc.id, clientData)

      console.log(`[checkDuplicateEmail] Found duplicate client:`, client)
      return { exists: true, client: client || undefined }
    }

    return { exists: false }
  } catch (error) {
    console.error("[checkDuplicateEmail] Error:", error)
    return { exists: false, error }
  }
}

// Get trainer name by ID
export async function getTrainerName(trainerId: string): Promise<string> {
  try {
    console.log("Getting trainer name for ID:", trainerId)

    if (!trainerId) {
      console.error("No trainer ID provided")
      return ""
    }

    const userRef = doc(db, "users", trainerId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      console.error("Trainer not found")
      return ""
    }

    const userData = userDoc.data()
    const name = userData.name || userData.firstName || ""
    console.log("Found trainer name:", name)
    return name
  } catch (error) {
    console.error("Error getting trainer name:", error)
    return ""
  }
}

// Generate invitation link with trainer name encoded in URL
export function generateInviteLink(inviteCode: string, trainerName: string): string {
  if (!inviteCode) {
    console.error("Invite code is required")
    return ""
  }

  const encodedTrainerName = encodeURIComponent(trainerName || "")
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "")

  return `${appUrl}/invite/${inviteCode}?tn=${encodedTrainerName}`
}

// Process an invitation when a client creates an account
export async function processInvitation(
  inviteCode: string,
  userId: string,
): Promise<{ success: boolean; trainerId?: string; clientId?: string; error?: any }> {
  try {
    console.log(`[processInvitation] Processing invitation code: ${inviteCode} for user: ${userId}`)

    if (!inviteCode || !userId) {
      console.error("[processInvitation] Invite code and user ID are required")
      return {
        success: false,
        error: new Error("Invite code and user ID are required"),
      }
    }

    // Find the client with this invitation code across all trainers
    const clientsRef = collection(db, "users")
    const trainersSnapshot = await getDocs(clientsRef)

    let clientData = null
    let trainerId = null
    let clientId = null
    let clientRef = null

    // Search through each trainer's clients subcollection
    console.log(`[processInvitation] Searching for invitation code across ${trainersSnapshot.size} trainers`)

    for (const trainerDoc of trainersSnapshot.docs) {
      try {
        const trainerClientsRef = collection(db, "users", trainerDoc.id, "clients")
        const q = query(trainerClientsRef, where("inviteCode", "==", inviteCode))

        console.log(`[processInvitation] Checking trainer: ${trainerDoc.id}`)
        const clientsSnapshot = await getDocs(q)

        if (!clientsSnapshot.empty) {
          clientData = clientsSnapshot.docs[0].data()
          trainerId = trainerDoc.id
          clientId = clientsSnapshot.docs[0].id
          clientRef = doc(trainerClientsRef, clientId)

          console.log(`[processInvitation] Found matching client: ${clientId} with status: ${clientData.status}`)
          break
        }
      } catch (trainerError) {
        console.error(`[processInvitation] Error checking trainer ${trainerDoc.id}:`, trainerError)
        continue
      }
    }

    if (!clientData || !clientRef) {
      console.error("[processInvitation] Invitation not found")
      return { success: false, error: new Error("Invitation not found") }
    }

    console.log(
      `[processInvitation] Updating client status from ${clientData.status} to Active and adding userId: ${userId}`,
    )

    await updateDoc(clientRef, {
      userId: userId,
      isTemporary: false,
      status: "Active",
      updatedAt: serverTimestamp(),
    })

    console.log(`[processInvitation] Updated client ${clientId} with user ID ${userId}`)

    // Add the trainer to the user's trainers list
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      trainers: arrayUnion(trainerId),
      updatedAt: serverTimestamp(),
    })

    console.log(`[processInvitation] Added trainer ${trainerId} to user ${userId} trainers list`)

    return { success: true, trainerId, clientId }
  } catch (error) {
    console.error("[processInvitation] Error processing invitation:", error)
    return {
      success: false,
      error,
    }
  }
}

// Additional utility functions
export async function createClient(
  trainerId: string,
  clientData: Omit<Client, "id" | "createdAt" | "_lastUpdated">,
): Promise<string> {
  try {
    console.log("ClientService: Creating client for trainer:", trainerId)

    if (!trainerId) {
      throw new Error("Trainer ID is required")
    }

    const now = new Date()
    const newClient = {
      ...clientData,
      createdAt: now,
      _lastUpdated: Date.now(),
    }

    const clientsRef = collection(db, "users", trainerId, "clients")
    const docRef = await addDoc(clientsRef, newClient)

    console.log("ClientService: Client created with ID:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("ClientService: Error creating client:", error)
    throw error
  }
}

export async function updateClient(
  trainerId: string,
  clientId: string,
  updates: Partial<Client>,
): Promise<{ success: boolean; error?: any }> {
  try {
    if (!trainerId || !clientId) {
      return { success: false, error: new Error("Trainer ID and Client ID are required") }
    }

    const clientRef = doc(db, "users", trainerId, "clients", clientId)
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
      _lastUpdated: Date.now(),
    }

    await updateDoc(clientRef, updateData)

    console.log("[updateClient] Client updated:", clientId)
    return { success: true }
  } catch (error) {
    console.error("[updateClient] Error:", error)
    return { success: false, error }
  }
}

export async function deleteClient(trainerId: string, clientId: string): Promise<{ success: boolean; error?: any }> {
  try {
    if (!trainerId || !clientId) {
      return { success: false, error: new Error("Trainer ID and Client ID are required") }
    }

    const clientRef = doc(db, "users", trainerId, "clients", clientId)
    await deleteDoc(clientRef)

    console.log("[deleteClient] Client deleted:", clientId)
    return { success: true }
  } catch (error) {
    console.error("[deleteClient] Error:", error)
    return { success: false, error }
  }
}
