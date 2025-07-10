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
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  orderBy,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import type { Client } from "@/types/client"
import { getUserById } from "@/lib/firebase/user-service"

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

// Improved subscribeToClients function with better logging and error handling
export function subscribeToClients(trainerId: string, callback: (clients: Client[], error?: any) => void): () => void {
  if (!trainerId) {
    console.error("[subscribeToClients] Trainer ID is required")
    callback([], new Error("Trainer ID is required"))
    return () => {}
  }

  try {
    console.log("[subscribeToClients] Setting up subscription for trainer:", trainerId)

    const clientsRef = collection(db, "clients")
    const q = query(clientsRef, where("trainerId", "==", trainerId))

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        console.log("[subscribeToClients] Received snapshot with", querySnapshot.size, "documents")

        const clients: Client[] = []

        querySnapshot.forEach((doc) => {
          try {
            const client = mapClientData(doc.id, doc.data())
            if (client) {
              clients.push(client)
              console.log("[subscribeToClients] Mapped client:", { id: client.id, name: client.name })
            }
          } catch (mappingError) {
            console.error("[subscribeToClients] Error mapping client document:", doc.id, mappingError)
          }
        })

        // Sort clients by createdAt on the client side
        clients.sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(0)
          const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(0)
          return dateB.getTime() - dateA.getTime()
        })

        console.log("[subscribeToClients] Calling callback with", clients.length, "clients")
        callback(clients)
      },
      (error) => {
        console.error("[subscribeToClients] Firestore subscription error:", error)
        callback([], error)
      },
    )

    console.log("[subscribeToClients] Subscription setup complete")
    return unsubscribe
  } catch (error) {
    console.error("[subscribeToClients] Error setting up subscription:", error)
    callback([], error)
    return () => {}
  }
}

// Get clients for a trainer (one-time fetch)
export async function getClientsByTrainer(trainerId: string): Promise<{ clients: Client[]; error?: any }> {
  try {
    if (!trainerId) {
      return { clients: [], error: new Error("Trainer ID is required") }
    }

    console.log("[getClientsByTrainer] Fetching clients for trainer:", trainerId)

    const clientsRef = collection(db, "clients")
    const q = query(clientsRef, where("trainerId", "==", trainerId))

    const querySnapshot = await getDocs(q)

    const clients: Client[] = []
    querySnapshot.forEach((doc) => {
      try {
        const client = mapClientData(doc.id, doc.data())
        if (client) {
          clients.push(client)
        }
      } catch (mappingError) {
        console.error("[getClientsByTrainer] Error mapping client:", doc.id, mappingError)
      }
    })

    // Sort by createdAt
    clients.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(0)
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(0)
      return dateB.getTime() - dateA.getTime()
    })

    console.log("[getClientsByTrainer] Found", clients.length, "clients")
    return { clients }
  } catch (error) {
    console.error("[getClientsByTrainer] Error:", error)
    return { clients: [], error }
  }
}

// Update a client
export async function updateClientData(
  clientId: string,
  updates: Partial<Client>,
): Promise<{ success: boolean; error?: any }> {
  try {
    if (!clientId) {
      return { success: false, error: new Error("Client ID is required") }
    }

    const clientRef = doc(db, "clients", clientId)
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    }

    await updateDoc(clientRef, updateData)

    console.log("[updateClientData] Client updated:", clientId)
    return { success: true }
  } catch (error) {
    console.error("[updateClientData] Error:", error)
    return { success: false, error }
  }
}

// Delete a client
export async function deleteClientData(clientId: string): Promise<{ success: boolean; error?: any }> {
  try {
    if (!clientId) {
      return { success: false, error: new Error("Client ID is required") }
    }

    const clientRef = doc(db, "clients", clientId)
    await deleteDoc(clientRef)

    console.log("[deleteClientData] Client deleted:", clientId)
    return { success: true }
  } catch (error) {
    console.error("[deleteClientData] Error:", error)
    return { success: false, error }
  }
}

// Get a single client by ID
export async function getClientById(clientId: string): Promise<{ client: Client | null; error?: any }> {
  try {
    if (!clientId) {
      return { client: null, error: new Error("Client ID is required") }
    }

    const clientRef = doc(db, "clients", clientId)
    const clientDoc = await getDoc(clientRef)

    if (!clientDoc.exists()) {
      console.log("[getClientById] Client not found:", clientId)
      return { client: null }
    }

    const client = mapClientData(clientDoc.id, clientDoc.data())
    return { client }
  } catch (error) {
    console.error("[getClientById] Error:", error)
    return { client: null, error }
  }
}

// Get trainer name by ID - using the existing getUserById function
export async function getTrainerName(trainerId: string): Promise<string> {
  try {
    console.log("Getting trainer name for ID:", trainerId)

    if (!trainerId) {
      console.error("No trainer ID provided")
      return ""
    }

    const userData = await getUserById(trainerId)

    if (!userData) {
      console.error("Trainer not found")
      return ""
    }

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

// Find a client by invitation code
export async function findClientByInvitationCode(
  inviteCode: string,
): Promise<{ exists: boolean; trainerId?: string; clientId?: string; status?: string; error?: any }> {
  try {
    console.log(`[findClientByInvitationCode] Searching for invitation code: ${inviteCode}`)

    if (!inviteCode) {
      console.error("[findClientByInvitationCode] Invite code is required")
      return { exists: false, error: new Error("Invite code is required") }
    }

    // Find the client with this invitation code across all trainers
    const clientsRef = collection(db, "users")
    const trainersSnapshot = await getDocs(clientsRef)

    console.log(`[findClientByInvitationCode] Searching across ${trainersSnapshot.size} trainers`)

    // Search through each trainer's clients subcollection
    for (const trainerDoc of trainersSnapshot.docs) {
      try {
        const trainerClientsRef = collection(db, "users", trainerDoc.id, "clients")
        const q = query(trainerClientsRef, where("inviteCode", "==", inviteCode))

        console.log(`[findClientByInvitationCode] Checking trainer: ${trainerDoc.id}`)
        const clientsSnapshot = await getDocs(q)

        if (!clientsSnapshot.empty) {
          const clientDoc = clientsSnapshot.docs[0]
          const clientData = clientDoc.data()

          console.log(
            `[findClientByInvitationCode] Found matching client: ${clientDoc.id} with status: ${clientData.status}`,
          )

          return {
            exists: true,
            trainerId: trainerDoc.id,
            clientId: clientDoc.id,
            status: clientData.status,
          }
        }
      } catch (trainerError) {
        console.error(`[findClientByInvitationCode] Error checking trainer ${trainerDoc.id}:`, trainerError)
        // Continue to next trainer
      }
    }

    console.log(`[findClientByInvitationCode] No client found with invitation code: ${inviteCode}`)
    return { exists: false }
  } catch (error) {
    console.error("[findClientByInvitationCode] Error finding client by invitation code:", error)
    return { exists: false, error }
  }
}

// Check if a user already has a client profile with a trainer
export async function checkExistingClientProfile(
  userId: string,
  trainerId: string,
): Promise<{ exists: boolean; clientId?: string; error?: any }> {
  try {
    if (!userId || !trainerId) {
      return { exists: false, error: new Error("User ID and trainer ID are required") }
    }

    const clientsCollectionRef = collection(db, "users", trainerId, "clients")
    const q = query(clientsCollectionRef, where("userId", "==", userId))

    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      return { exists: true, clientId: querySnapshot.docs[0].id }
    }

    return { exists: false }
  } catch (error) {
    console.error("[checkExistingClientProfile] Error:", error)
    return { exists: false, error }
  }
}

// Replace a temporary client with a permanent one
export async function replaceTemporaryClient(
  trainerId: string,
  temporaryClientId: string,
  userId: string,
): Promise<{ success: boolean; error?: any }> {
  try {
    if (!trainerId || !temporaryClientId || !userId) {
      return {
        success: false,
        error: new Error("Trainer ID, temporary client ID, and user ID are required"),
      }
    }

    // Get the temporary client data
    const tempClientRef = doc(collection(db, "users", trainerId, "clients"), temporaryClientId)
    const tempClientDoc = await getDoc(tempClientRef)

    if (!tempClientDoc.exists()) {
      return { success: false, error: new Error("Temporary client not found") }
    }

    const tempClientData = tempClientDoc.data()

    // Check if there's already a permanent client for this user
    const { exists, clientId, error: checkError } = await checkExistingClientProfile(userId, trainerId)

    if (checkError) {
      return { success: false, error: checkError }
    }

    if (exists && clientId) {
      // Update the existing client with any new data from the temporary client
      const clientRef = doc(collection(db, "users", trainerId, "clients"), clientId)
      await updateDoc(clientRef, {
        // Only update fields that might be useful from the temporary client
        program: tempClientData.program || "",
        goal: tempClientData.goal || "",
        notes: tempClientData.notes || "",
        updatedAt: serverTimestamp(),
      })

      // Delete the temporary client
      await deleteDoc(tempClientRef)
    } else {
      // Convert the temporary client to a permanent one
      await updateDoc(tempClientRef, {
        userId: userId,
        isTemporary: false,
        status: "Active",
        updatedAt: serverTimestamp(),
      })
    }

    return { success: true }
  } catch (error) {
    console.error("[replaceTemporaryClient] Error:", error)
    return { success: false, error }
  }
}

// Add this new function to check and link pending clients with user accounts
export async function linkPendingClientsWithUsers(trainerId: string): Promise<void> {
  try {
    console.log(`[linkPendingClientsWithUsers] Starting linking process for trainer: ${trainerId}`)

    if (!trainerId) {
      console.error("[linkPendingClientsWithUsers] Trainer ID is required")
      return
    }

    // Get all users with invitation codes
    const usersRef = collection(db, "users")
    const userQuery = query(usersRef, where("inviteCode", "!=", ""))
    const usersSnapshot = await getDocs(userQuery)

    console.log(`[linkPendingClientsWithUsers] Found ${usersSnapshot.size} users with invitation codes`)

    // Map of invitation codes to user IDs for faster lookup
    const invitationCodeMap = new Map<string, string>()

    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data()
      if (userData.inviteCode) {
        console.log(`[linkPendingClientsWithUsers] User ${userDoc.id} has invitation code: ${userData.inviteCode}`)
        invitationCodeMap.set(userData.inviteCode, userDoc.id)
      }
    })

    // Get all clients for this trainer
    const clientsCollectionRef = collection(db, "users", trainerId, "clients")
    const clientsSnapshot = await getDocs(clientsCollectionRef)

    console.log(`[linkPendingClientsWithUsers] Found ${clientsSnapshot.size} clients for trainer ${trainerId}`)

    let updateCount = 0

    // For each client, check if there's a user with a matching invitation code
    for (const clientDoc of clientsSnapshot.docs) {
      const clientData = clientDoc.data()
      const clientId = clientDoc.id

      // Skip if already has userId or no invite code
      if (clientData.userId || !clientData.inviteCode) {
        continue
      }

      console.log(
        `[linkPendingClientsWithUsers] Checking client ${clientId} with invite code: ${clientData.inviteCode}`,
      )

      // Check if we have a user with this invitation code
      const userId = invitationCodeMap.get(clientData.inviteCode)

      if (userId) {
        console.log(`[linkPendingClientsWithUsers] Found matching user ${userId} for client ${clientId}`)

        // Update the client document with the user ID
        await updateDoc(clientDoc.ref, {
          userId: userId,
          status: "Active",
          isTemporary: false,
          updatedAt: serverTimestamp(),
        })

        console.log(`[linkPendingClientsWithUsers] Updated client ${clientId} with user ID ${userId}`)

        // Add the trainer to the user's trainers list
        const userRef = doc(db, "users", userId)
        await updateDoc(userRef, {
          trainers: arrayUnion(trainerId),
          updatedAt: serverTimestamp(),
        })

        console.log(`[linkPendingClientsWithUsers] Added trainer ${trainerId} to user ${userId} trainers list`)

        updateCount++
      }
    }

    console.log(`[linkPendingClientsWithUsers] Completed linking process. Updated ${updateCount} clients.`)
  } catch (error) {
    console.error("[linkPendingClientsWithUsers] Error linking pending clients with users:", error)
  }
}

// Get pending clients for a trainer
export async function getPendingClients(trainerId: string): Promise<Client[]> {
  try {
    if (!trainerId) {
      console.error("Trainer ID is required")
      return []
    }

    const clientsCollectionRef = collection(db, "users", trainerId, "clients")
    const q = query(clientsCollectionRef, where("status", "==", "Pending"), orderBy("createdAt", "desc"))

    const querySnapshot = await getDocs(q)

    const clients: Client[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      const client = mapClientData(doc.id, data)
      if (client) {
        clients.push(client)
      }
    })

    return clients
  } catch (error) {
    console.error("Error getting pending clients:", error)
    return []
  }
}

// Add this new function to handle invitation codes during login
export async function processLoginInvitation(
  invitationCode: string,
  userId: string,
): Promise<{ success: boolean; trainerId?: string; error?: any }> {
  try {
    console.log(`[processLoginInvitation] Processing invitation code ${invitationCode} for user ${userId}`)

    if (!invitationCode || !userId) {
      console.error("[processLoginInvitation] Invitation code and user ID are required")
      return {
        success: false,
        error: new Error("Invitation code and user ID are required"),
      }
    }

    // Find trainer with this universal invite code
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("universalInviteCode", "==", invitationCode))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.error(`[processLoginInvitation] No trainer found with invitation code: ${invitationCode}`)
      return {
        success: false,
        error: new Error("Invalid invitation code"),
      }
    }

    const trainerDoc = querySnapshot.docs[0]
    const trainerId = trainerDoc.id
    console.log(`[processLoginInvitation] Found trainer: ${trainerId}`)

    // Update user with pending approval status
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      status: "pending_approval",
      invitedBy: trainerId,
      universalInviteCode: invitationCode,
      updatedAt: serverTimestamp(),
    })

    // Add user to trainer's pending users list
    const trainerRef = doc(db, "users", trainerId)
    console.log(`[processLoginInvitation] Adding user ${userId} to trainer ${trainerId} pending list`)

    await updateDoc(trainerRef, {
      pendingUsers: arrayUnion(userId),
      updatedAt: serverTimestamp(),
    })

    console.log(`[processLoginInvitation] ✅ Successfully processed invitation for user ${userId}`)
    return { success: true, trainerId }
  } catch (error) {
    console.error(`[processLoginInvitation] Unexpected error:`, error)
    return {
      success: false,
      error,
    }
  }
}

// New functions from updates
export async function createClient(
  trainerId: string,
  clientData: Omit<Client, "id" | "trainerId" | "createdAt" | "updatedAt">,
): Promise<string> {
  try {
    console.log("ClientService: Creating client for trainer:", trainerId)

    if (!trainerId) {
      throw new Error("Trainer ID is required")
    }

    const now = new Date()
    const newClient = {
      ...clientData,
      trainerId,
      createdAt: now,
      updatedAt: now,
    }

    const clientsRef = collection(db, "clients")
    const docRef = await addDoc(clientsRef, newClient)

    console.log("ClientService: Client created with ID:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("ClientService: Error creating client:", error)
    throw error
  }
}
