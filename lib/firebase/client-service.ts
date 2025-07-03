import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  arrayUnion,
  deleteDoc,
  query,
  orderBy,
  addDoc,
  where,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import type { Client } from "@/types/client"
import { ErrorType, createError, logError, tryCatch } from "@/lib/utils/error-handler"
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

// NEW: Get user data by following the userId from client document
async function getUserDataFromUserId(userId: string): Promise<any> {
  try {
    if (!userId) {
      console.log(`[getUserDataFromUserId] No userId provided`)
      return null
    }

    const userPath = `users/${userId}`
    console.log(`[getUserDataFromUserId] 📍 Following userId to path: /${userPath}`)

    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      const userData = userDoc.data()
      console.log(`[getUserDataFromUserId] ✅ Found user data:`, {
        id: userId,
        name: userData.name || "NO_NAME",
        email: userData.email || "NO_EMAIL",
        status: userData.status || "NO_STATUS",
        hasTrainers: !!(userData.trainers && userData.trainers.length > 0),
      })
      return userData
    } else {
      console.log(`[getUserDataFromUserId] ❌ User document does not exist at /${userPath}`)
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

  console.log(`[mapClientDataWithUserInfo] 🔍 Processing client ${id}:`, {
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
  const mergedData = {
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
    email: userData?.email || data.email || "", // Prefer user document email
    goal: data.goal || "",
    program: data.program || "",
    createdAt: data.createdAt,
    inviteCode: data.inviteCode || "",
    userId: data.userId || "",
    phone: userData?.phone || data.phone || "", // Prefer user document phone
    // Add user-specific data
    userStatus: userData?.status || "unknown",
    hasLinkedAccount: !!(data.userId && userData),
    _lastUpdated: Date.now(),
  } as Client

  console.log(`[mapClientDataWithUserInfo] ✅ Mapped client:`, {
    id: mergedData.id,
    name: mergedData.name,
    email: mergedData.email,
    status: mergedData.status,
    userId: mergedData.userId,
    hasLinkedAccount: mergedData.hasLinkedAccount,
    userStatus: mergedData.userStatus,
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

  // Ensure we're getting the most up-to-date data
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
    createdAt: data.createdAt,
    inviteCode: data.inviteCode || "",
    userId: data.userId || "",
    phone: data.phone || "",
    _lastUpdated: Date.now(),
  } as Client
}

// Get all clients for a specific trainer - ENHANCED WITH DETAILED PATH LOGGING AND USER DATA FOLLOWING
export async function fetchClients(trainerUid: string): Promise<Client[]> {
  try {
    console.log(`[fetchClients] 🚀 === STARTING CLIENT FETCH PROCESS ===`)
    console.log(`[fetchClients] 🔍 Trainer ID: ${trainerUid}`)
    console.log(`[fetchClients] 🔗 Firebase app: ${db.app.name}`)
    console.log(`[fetchClients] 🔗 Firebase project: ${db.app.options.projectId}`)

    if (!trainerUid) {
      console.log(`[fetchClients] ❌ No trainer UID provided`)
      return []
    }

    // STEP 1: Define and log the exact Firestore paths
    const trainerPath = `users/${trainerUid}`
    const clientsCollectionPath = `users/${trainerUid}/clients`

    console.log(`[fetchClients] 📍 FIRESTORE PATHS:`)
    console.log(`[fetchClients]   - Trainer document: /${trainerPath}`)
    console.log(`[fetchClients]   - Clients collection: /${clientsCollectionPath}`)

    // STEP 2: Verify trainer document exists
    console.log(`[fetchClients] 🔍 Step 1: Verifying trainer document exists...`)
    const trainerRef = doc(db, "users", trainerUid)
    const trainerDoc = await getDoc(trainerRef)

    if (!trainerDoc.exists()) {
      console.log(`[fetchClients] ❌ TRAINER DOCUMENT DOES NOT EXIST at /${trainerPath}`)
      return []
    }

    const trainerData = trainerDoc.data()
    console.log(`[fetchClients] ✅ Trainer document exists:`, {
      name: trainerData.name || "NO_NAME",
      email: trainerData.email || "NO_EMAIL",
      hasClients: !!(trainerData.clients && trainerData.clients.length > 0),
      clientsArray: trainerData.clients || [],
    })

    // STEP 3: Query the clients collection
    console.log(`[fetchClients] 🔍 Step 2: Querying clients collection...`)
    const clientsCollectionRef = collection(db, "users", trainerUid, "clients")

    // Try simple query first
    console.log(`[fetchClients] 📡 Executing simple query on /${clientsCollectionPath}`)
    const simpleQuery = query(clientsCollectionRef)
    const simpleSnapshot = await getDocs(simpleQuery)

    console.log(`[fetchClients] 📊 Simple query result: ${simpleSnapshot.size} documents`)

    if (simpleSnapshot.size === 0) {
      console.log(`[fetchClients] ⚠️ CLIENTS COLLECTION IS EMPTY`)
      console.log(`[fetchClients] 💡 This means no client documents exist at /${clientsCollectionPath}`)
      return []
    }

    // STEP 4: Process each client document and follow userId links
    console.log(`[fetchClients] 🔍 Step 3: Processing client documents and following userId links...`)
    const clients: Client[] = []
    let processedCount = 0

    for (const docSnapshot of simpleSnapshot.docs) {
      processedCount++
      const clientId = docSnapshot.id
      const clientData = docSnapshot.data()

      console.log(`[fetchClients] 📄 Processing client ${processedCount}/${simpleSnapshot.size} (${clientId}):`)
      console.log(`[fetchClients]   - Document path: /${clientsCollectionPath}/${clientId}`)
      console.log(`[fetchClients]   - Name: ${clientData.name || "NO_NAME"}`)
      console.log(`[fetchClients]   - Status: ${clientData.status || "NO_STATUS"}`)
      console.log(`[fetchClients]   - UserId: ${clientData.userId || "NO_USER_ID"}`)
      console.log(`[fetchClients]   - Email in client doc: ${clientData.email || "NO_EMAIL"}`)
      console.log(`[fetchClients]   - IsTemporary: ${clientData.isTemporary || false}`)

      // Use enhanced mapping that follows userId
      const client = await mapClientDataWithUserInfo(clientId, clientData)

      if (client) {
        clients.push(client)
        console.log(`[fetchClients] ✅ Added client to results:`, {
          id: client.id,
          name: client.name,
          status: client.status,
          hasLinkedAccount: client.hasLinkedAccount,
          email: client.email,
        })
      } else {
        console.log(`[fetchClients] ❌ Skipped invalid client: ${clientId}`)
      }
    }

    // STEP 5: Final summary and filtering
    console.log(`[fetchClients] 📈 PROCESSING SUMMARY:`)
    console.log(`[fetchClients]   - Total documents found: ${simpleSnapshot.size}`)
    console.log(`[fetchClients]   - Valid clients processed: ${clients.length}`)
    console.log(`[fetchClients]   - Firestore paths used:`)
    console.log(`[fetchClients]     * Trainer: /${trainerPath}`)
    console.log(`[fetchClients]     * Clients: /${clientsCollectionPath}`)
    console.log(`[fetchClients]     * User docs: /users/{userId} (for each client with userId)`)

    // Log each client with detailed info
    clients.forEach((client, index) => {
      console.log(`[fetchClients] 🎯 Client ${index + 1} details:`, {
        id: client.id,
        name: client.name,
        status: client.status,
        userId: client.userId || "NO_USER_ID",
        email: client.email || "NO_EMAIL",
        hasLinkedAccount: client.hasLinkedAccount,
        userStatus: client.userStatus,
        willShowInDialog: !!(client.userId && client.hasLinkedAccount && client.status === "Active"),
      })
    })

    console.log(`[fetchClients] 🏁 === FETCH PROCESS COMPLETE ===`)
    return clients
  } catch (error) {
    console.error(`[fetchClients] ❌ UNEXPECTED ERROR:`, error)
    console.error(`[fetchClients] ❌ Error details:`, {
      message: error.message,
      code: error.code,
      stack: error.stack?.substring(0, 500),
      trainerUid,
    })
    return []
  }
}

// NEW: Check for duplicate email in trainer's clients
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

    const [querySnapshot, queryError] = await tryCatch(() => getDocs(q), ErrorType.DB_READ_FAILED, {
      function: "checkDuplicateEmail",
      trainerId,
      email,
    })

    if (queryError || !querySnapshot) {
      return { exists: false, error: queryError }
    }

    if (!querySnapshot.empty) {
      const clientDoc = querySnapshot.docs[0]
      const clientData = clientDoc.data()
      const client = mapClientData(clientDoc.id, clientData)

      console.log(`[checkDuplicateEmail] Found duplicate client:`, client)
      return { exists: true, client: client || undefined }
    }

    return { exists: false }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "checkDuplicateEmail", trainerId, email },
      "Unexpected error checking duplicate email",
    )
    logError(appError)
    return { exists: false, error: appError }
  }
}

// Improved subscribeToClients function with better logging and error handling
export function subscribeToClients(trainerUid: string, callback: (clients: Client[], error?: any) => void) {
  if (!trainerUid) {
    const error = createError(
      ErrorType.API_MISSING_PARAMS,
      null,
      { function: "subscribeToClients" },
      "No trainer UID provided for subscription",
    )
    logError(error)
    callback([], error)
    return () => {}
  }

  console.log(`[REALTIME] Setting up real-time listener for trainer: ${trainerUid}`)

  try {
    const clientsCollectionRef = collection(db, "users", trainerUid, "clients")
    const q = query(clientsCollectionRef, orderBy("createdAt", "desc"))

    // Create a single subscription and return the unsubscribe function
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log(`[REALTIME] Received update: ${snapshot.size} clients, ${snapshot.docChanges().length} changes`)

        // Log all changes for debugging
        snapshot.docChanges().forEach((change) => {
          const data = change.doc.data()
          console.log(`[REALTIME] Change (${change.type}):`, {
            id: change.doc.id,
            name: data.name,
            status: data.status,
            inviteCode: data.inviteCode,
            userId: data.userId || "none",
          })
        })

        const clients: Client[] = []

        snapshot.forEach((doc) => {
          const data = doc.data()
          const client = mapClientData(doc.id, data)
          if (client) {
            clients.push(client)
          }
        })

        console.log(`[REALTIME] Processed ${clients.length} valid clients, calling callback`)
        callback(clients)
      },
      (error) => {
        const appError = createError(
          ErrorType.DB_READ_FAILED,
          error,
          { function: "subscribeToClients", trainerUid },
          "Error in client subscription",
        )
        logError(appError)
        console.error("[REALTIME] Subscription error:", error)
        callback([], appError)
      },
      // Add this option to ensure we get the most up-to-date data
      { includeMetadataChanges: true },
    )

    return unsubscribe
  } catch (error) {
    console.error("[REALTIME] Error setting up subscription:", error)
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "subscribeToClients", trainerUid },
      "Unexpected error setting up client subscription",
    )
    logError(appError)
    callback([], appError)
    return () => {}
  }
}

// Get a specific client by ID
export async function getClient(trainerId: string, clientId: string): Promise<Client | null> {
  try {
    if (!trainerId || !clientId) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "getClient" },
        "Trainer ID and client ID are required",
      )
      logError(error)
      return null
    }

    const clientRef = doc(db, "users", trainerId, "clients", clientId)
    const [clientDoc, error] = await tryCatch(() => getDoc(clientRef), ErrorType.DB_READ_FAILED, {
      function: "getClient",
      trainerId,
      clientId,
    })

    if (error || !clientDoc) {
      return null
    }

    if (!clientDoc.exists()) {
      const error = createError(
        ErrorType.DB_DOCUMENT_NOT_FOUND,
        null,
        { function: "getClient", trainerId, clientId },
        "Client not found",
      )
      logError(error)
      return null
    }

    const data = clientDoc.data()
    return mapClientData(clientDoc.id, data)
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "getClient", trainerId, clientId },
      "Unexpected error fetching client",
    )
    logError(appError)
    return null
  }
}

// Alias for fetchClients to maintain compatibility
export const getTrainerClients = fetchClients

// Soft delete a client (change status to "Deleted" instead of removing document)
export async function deleteClient(trainerId: string, clientId: string): Promise<{ success: boolean; error: any }> {
  try {
    if (!trainerId || !clientId) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "deleteClient" },
        "Trainer ID and client ID are required",
      )
      logError(error)
      return { success: false, error }
    }

    // 1. Get the client document to verify it exists
    const clientRef = doc(collection(db, "users", trainerId, "clients"), clientId)
    const [clientDoc, getError] = await tryCatch(() => getDoc(clientRef), ErrorType.DB_READ_FAILED, {
      function: "deleteClient",
      trainerId,
      clientId,
    })

    if (getError || !clientDoc) {
      return { success: false, error: getError }
    }

    if (!clientDoc.exists()) {
      const error = createError(
        ErrorType.DB_DOCUMENT_NOT_FOUND,
        null,
        { function: "deleteClient", trainerId, clientId },
        "Client not found",
      )
      logError(error)
      return { success: false, error }
    }

    // 2. Update the client document status to "Deleted" instead of deleting it
    const [, updateError] = await tryCatch(
      () =>
        updateDoc(clientRef, {
          status: "Deleted",
          deletedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      ErrorType.DB_WRITE_FAILED,
      { function: "deleteClient", trainerId, clientId },
    )

    if (updateError) {
      return { success: false, error: updateError }
    }

    return { success: true, error: null }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "deleteClient", trainerId, clientId },
      "Unexpected error deleting client",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}

// Create a new client - NO individual invite codes generated
export async function createClient(
  trainerId: string,
  clientData: {
    name: string
    email?: string
    phone?: string
    goal?: string
    notes?: string
    program?: string
  },
): Promise<{ success: boolean; clientId?: string; error?: any }> {
  try {
    console.log("createClient called with:", { trainerId, clientData })

    if (!trainerId) {
      console.error("Missing trainer ID")
      return {
        success: false,
        error: new Error("Trainer ID is required"),
      }
    }

    if (!clientData || !clientData.name) {
      console.error("Missing client name")
      return {
        success: false,
        error: new Error("Client name is required"),
      }
    }

    // Ensure no undefined values
    const sanitizedClientData = {
      name: clientData.name,
      email: clientData.email || "",
      phone: clientData.phone || "",
      goal: clientData.goal || "",
      notes: clientData.notes || "",
      program: clientData.program || "",
    }

    // Create the client document data object - NO individual invite code
    const clientDocData = {
      ...sanitizedClientData,
      status: "Pending",
      progress: 0,
      sessions: { completed: 0, total: 0 },
      completion: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isTemporary: true,
    }

    // Create a new client document
    const clientsCollectionRef = collection(db, "users", trainerId, "clients")
    try {
      const newClientRef = await addDoc(clientsCollectionRef, clientDocData)
      console.log("Client document created with ID:", newClientRef.id)

      // Update the document with its own ID
      await updateDoc(newClientRef, {
        id: newClientRef.id,
      })

      // Add client to trainer's clients array
      const trainerRef = doc(db, "users", trainerId)
      await updateDoc(trainerRef, {
        clients: arrayUnion(newClientRef.id),
        updatedAt: serverTimestamp(),
      })

      return {
        success: true,
        clientId: newClientRef.id,
      }
    } catch (err) {
      console.error("Firebase operation failed:", err)
      return {
        success: false,
        error: err,
      }
    }
  } catch (error) {
    console.error("Unexpected error in createClient:", error)
    return {
      success: false,
      error: error,
    }
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

    // Use the existing getUserById function
    const userData = await getUserById(trainerId)

    if (!userData) {
      console.error("Trainer not found")
      return ""
    }

    // Extract the name from the user data
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

  // Encode the trainer name to safely include it in the URL
  const encodedTrainerName = encodeURIComponent(trainerName || "")

  // Get the app URL from environment or use a default
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "")

  // Build the invitation URL with the encoded trainer name - restore the original /invite/ path
  return `${appUrl}/invite/${inviteCode}?tn=${encodedTrainerName}`
}

// Update a client
export async function updateClient(
  trainerId: string,
  clientId: string,
  updates: Partial<Client>,
): Promise<{ success: boolean; error: any }> {
  try {
    if (!trainerId || !clientId) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "updateClient" },
        "Trainer ID and client ID are required",
      )
      logError(error)
      return { success: false, error }
    }

    // Ensure no undefined values
    const sanitizedUpdates: Record<string, any> = {}
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        sanitizedUpdates[key] = value === null ? "" : value
      }
    }

    // Remove any fields that shouldn't be directly updated
    const { id, initials, ...validUpdates } = sanitizedUpdates

    const clientRef = doc(collection(db, "users", trainerId, "clients"), clientId)

    const [, updateError] = await tryCatch(
      () =>
        updateDoc(clientRef, {
          ...validUpdates,
          updatedAt: serverTimestamp(),
        }),
      ErrorType.DB_WRITE_FAILED,
      { function: "updateClient", trainerId, clientId, updates },
    )

    if (updateError) {
      return { success: false, error: updateError }
    }

    return { success: true, error: null }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "updateClient", trainerId, clientId, updates },
      "Unexpected error updating client",
    )
    logError(appError)
    return { success: false, error: appError }
  }
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
        error: createError(
          ErrorType.API_MISSING_PARAMS,
          null,
          { function: "processInvitation" },
          "Invite code and user ID are required",
        ),
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
        // Continue to next trainer
      }
    }

    if (!clientData) {
      console.error("[processInvitation] Invitation not found")
      return { success: false, error: new Error("Invitation not found") }
    }

    console.log(
      `[processInvitation] Updating client status from ${clientData.status} to Active and adding userId: ${userId}`,
    )

    await updateDoc(clientRef, {
      userId: userId,
      isTemporary: false,
      status: "Active", // Final status after account creation
      updatedAt: serverTimestamp(),
    })

    console.log(`[processInvitation] Updated client ${clientId} status to Active and added userId: ${userId}`)

    // Add the trainer to the user's trainers list
    const userRef = doc(collection(db, "users"), userId)
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
      error: createError(
        ErrorType.UNKNOWN_ERROR,
        error,
        { function: "processInvitation", userId, inviteCode },
        "Unexpected error processing invitation",
      ),
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
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "checkExistingClientProfile" },
        "User ID and trainer ID are required",
      )
      logError(error)
      return { exists: false, error }
    }

    const clientsCollectionRef = collection(db, "users", trainerId, "clients")
    const q = query(clientsCollectionRef, where("userId", "==", userId))

    const [querySnapshot, queryError] = await tryCatch(() => getDocs(q), ErrorType.DB_READ_FAILED, {
      function: "checkExistingClientProfile",
      userId,
      trainerId,
    })

    if (queryError || !querySnapshot) {
      return { exists: false, error: queryError }
    }

    if (!querySnapshot.empty) {
      return { exists: true, clientId: querySnapshot.docs[0].id }
    }

    return { exists: false }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "checkExistingClientProfile", userId, trainerId },
      "Unexpected error checking existing client profile",
    )
    logError(appError)
    return { exists: false, error: appError }
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
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "replaceTemporaryClient" },
        "Trainer ID, temporary client ID, and user ID are required",
      )
      logError(error)
      return { success: false, error }
    }

    // Get the temporary client data
    const tempClientRef = doc(collection(db, "users", trainerId, "clients"), temporaryClientId)
    const [tempClientDoc, tempClientError] = await tryCatch(() => getDoc(tempClientRef), ErrorType.DB_READ_FAILED, {
      function: "replaceTemporaryClient",
      trainerId,
      temporaryClientId,
    })

    if (tempClientError || !tempClientDoc) {
      return { success: false, error: tempClientError }
    }

    if (!tempClientDoc.exists()) {
      const error = createError(
        ErrorType.DB_DOCUMENT_NOT_FOUND,
        null,
        { function: "replaceTemporaryClient", trainerId, temporaryClientId },
        "Temporary client not found",
      )
      logError(error)
      return { success: false, error }
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
      const [, updateError] = await tryCatch(
        () =>
          updateDoc(clientRef, {
            // Only update fields that might be useful from the temporary client
            program: tempClientData.program || "",
            goal: tempClientData.goal || "",
            notes: tempClientData.notes || "",
            updatedAt: serverTimestamp(),
          }),
        ErrorType.DB_WRITE_FAILED,
        { function: "replaceTemporaryClient", trainerId, clientId, temporaryClientId },
      )

      if (updateError) {
        return { success: false, error: updateError }
      }

      // Delete the temporary client
      const [, deleteError] = await tryCatch(() => deleteDoc(tempClientRef), ErrorType.DB_DELETE_FAILED, {
        function: "replaceTemporaryClient",
        trainerId,
        temporaryClientId,
      })

      if (deleteError) {
        // Log but continue, as the main operation succeeded
        logError(deleteError)
      }
    } else {
      // Convert the temporary client to a permanent one
      const [, updateError] = await tryCatch(
        () =>
          updateDoc(tempClientRef, {
            userId: userId,
            isTemporary: false,
            status: "Active",
            updatedAt: serverTimestamp(),
          }),
        ErrorType.DB_WRITE_FAILED,
        { function: "replaceTemporaryClient", trainerId, temporaryClientId, userId },
      )

      if (updateError) {
        return { success: false, error: updateError }
      }
    }

    return { success: true }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "replaceTemporaryClient", trainerId, temporaryClientId, userId },
      "Unexpected error replacing temporary client",
    )
    logError(appError)
    return { success: false, error: appError }
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

    const [querySnapshot, error] = await tryCatch(() => getDocs(q), ErrorType.DB_READ_FAILED, {
      function: "getPendingClients",
      trainerId,
    })

    if (error || !querySnapshot) {
      return []
    }

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
        error: createError(
          ErrorType.API_MISSING_PARAMS,
          null,
          { function: "processLoginInvitation" },
          "Invitation code and user ID are required",
        ),
      }
    }

    // Find trainer with this universal invite code
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("universalInviteCode", "==", invitationCode))
    const [querySnapshot, queryError] = await tryCatch(() => getDocs(q), ErrorType.DB_READ_FAILED, {
      function: "processLoginInvitation",
      inviteCode: invitationCode,
    })

    if (queryError || !querySnapshot) {
      console.error(`[processLoginInvitation] Error finding trainer:`, queryError)
      return { success: false, error: queryError }
    }

    if (querySnapshot.empty) {
      console.error(`[processLoginInvitation] No trainer found with invitation code: ${invitationCode}`)
      return {
        success: false,
        error: createError(
          ErrorType.DB_DOCUMENT_NOT_FOUND,
          null,
          { function: "processLoginInvitation", inviteCode: invitationCode },
          "Invalid invitation code",
        ),
      }
    }

    const trainerDoc = querySnapshot.docs[0]
    const trainerId = trainerDoc.id
    console.log(`[processLoginInvitation] Found trainer: ${trainerId}`)

    // Update user with pending approval status
    const userRef = doc(db, "users", userId)
    const [, updateUserError] = await tryCatch(
      () =>
        updateDoc(userRef, {
          status: "pending_approval",
          invitedBy: trainerId,
          universalInviteCode: invitationCode,
          updatedAt: serverTimestamp(),
        }),
      ErrorType.DB_WRITE_FAILED,
      { function: "processLoginInvitation", userId, trainerId },
    )

    if (updateUserError) {
      console.error(`[processLoginInvitation] Error updating user:`, updateUserError)
      return { success: false, error: updateUserError }
    }

    // Add user to trainer's pending users list
    const trainerRef = doc(db, "users", trainerId)
    console.log(`[processLoginInvitation] Adding user ${userId} to trainer ${trainerId} pending list`)

    const [, addToPendingError] = await tryCatch(
      () =>
        updateDoc(trainerRef, {
          pendingUsers: arrayUnion(userId),
          updatedAt: serverTimestamp(),
        }),
      ErrorType.DB_WRITE_FAILED,
      { function: "processLoginInvitation", userId, trainerId },
    )

    if (addToPendingError) {
      console.error(`[processLoginInvitation] Failed to add user to pending list:`, addToPendingError)
      return { success: false, error: addToPendingError }
    }

    console.log(`[processLoginInvitation] ✅ Successfully processed invitation for user ${userId}`)
    return { success: true, trainerId }
  } catch (error) {
    console.error(`[processLoginInvitation] Unexpected error:`, error)
    return {
      success: false,
      error: createError(
        ErrorType.UNKNOWN_ERROR,
        error,
        { function: "processLoginInvitation", userId, invitationCode },
        "Unexpected error processing invitation",
      ),
    }
  }
}
