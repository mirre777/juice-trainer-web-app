import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"

export interface Client {
  id: string
  name: string
  email: string
  phone?: string
  dateOfBirth?: Date | Timestamp
  gender?: "male" | "female" | "other"
  height?: number
  weight?: number
  fitnessLevel?: "beginner" | "intermediate" | "advanced"
  goals?: string[]
  medicalConditions?: string[]
  notes?: string
  trainerId: string
  userId?: string
  status: "active" | "inactive" | "pending"
  createdAt: Date | Timestamp
  updatedAt: Date | Timestamp
  lastWorkout?: Date | Timestamp
  totalWorkouts?: number
  avatar?: string
}

export interface ClientInvitation {
  id: string
  code: string
  trainerId: string
  clientEmail?: string
  clientName?: string
  status: "pending" | "accepted" | "expired"
  createdAt: Date | Timestamp
  expiresAt: Date | Timestamp
  acceptedAt?: Date | Timestamp
  acceptedBy?: string
}

export async function getClient(clientId: string): Promise<Client | null> {
  try {
    console.log(`[getClient] Getting client: ${clientId}`)

    const clientDoc = await getDoc(doc(db, "clients", clientId))

    if (!clientDoc.exists()) {
      console.log(`[getClient] Client not found: ${clientId}`)
      return null
    }

    const clientData = clientDoc.data() as Client
    clientData.id = clientDoc.id

    console.log(`[getClient] Found client:`, {
      id: clientData.id,
      name: clientData.name,
      email: clientData.email,
      status: clientData.status,
    })

    return clientData
  } catch (error) {
    console.error("[getClient] Error:", error)
    return null
  }
}

export async function createClient(
  clientData: Omit<Client, "id" | "createdAt" | "updatedAt">,
): Promise<{ success: boolean; client?: Client; error?: string }> {
  try {
    console.log("[createClient] Creating new client:", {
      name: clientData.name,
      email: clientData.email,
      trainerId: clientData.trainerId,
    })

    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newClient: Client = {
      ...clientData,
      id: clientId,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      totalWorkouts: 0,
    }

    const clientRef = doc(db, "clients", clientId)
    await setDoc(clientRef, newClient)

    console.log(`[createClient] Successfully created client: ${clientId}`)
    return { success: true, client: newClient }
  } catch (error: any) {
    console.error("[createClient] Error:", error)
    return { success: false, error: error.message }
  }
}

export async function updateClient(
  clientId: string,
  updates: Partial<Client>,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[updateClient] Updating client ${clientId} with:`, updates)

    const clientRef = doc(db, "clients", clientId)
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    }

    await updateDoc(clientRef, updateData)

    console.log(`[updateClient] Successfully updated client: ${clientId}`)
    return { success: true }
  } catch (error: any) {
    console.error("[updateClient] Error:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteClient(clientId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[deleteClient] Deleting client: ${clientId}`)

    await deleteDoc(doc(db, "clients", clientId))

    console.log(`[deleteClient] Successfully deleted client: ${clientId}`)
    return { success: true }
  } catch (error: any) {
    console.error("[deleteClient] Error:", error)
    return { success: false, error: error.message }
  }
}

export async function getClientsByTrainer(trainerId: string): Promise<Client[]> {
  try {
    console.log(`[getClientsByTrainer] Getting clients for trainer: ${trainerId}`)

    const clientsRef = collection(db, "clients")
    const q = query(clientsRef, where("trainerId", "==", trainerId), orderBy("createdAt", "desc"))

    const querySnapshot = await getDocs(q)
    const clients: Client[] = []

    querySnapshot.forEach((doc) => {
      const clientData = doc.data() as Client
      clientData.id = doc.id
      clients.push(clientData)
    })

    console.log(`[getClientsByTrainer] Found ${clients.length} clients for trainer: ${trainerId}`)
    return clients
  } catch (error) {
    console.error("[getClientsByTrainer] Error:", error)
    return []
  }
}

export async function createInvitation(
  trainerId: string,
  clientEmail?: string,
  clientName?: string,
): Promise<{ success: boolean; invitation?: ClientInvitation; error?: string }> {
  try {
    console.log("[createInvitation] Creating invitation:", {
      trainerId,
      clientEmail,
      clientName,
    })

    const invitationCode = Math.random().toString(36).substr(2, 8).toUpperCase()
    const invitationId = `invitation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const invitation: ClientInvitation = {
      id: invitationId,
      code: invitationCode,
      trainerId,
      clientEmail,
      clientName,
      status: "pending",
      createdAt: serverTimestamp() as Timestamp,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) as any, // 7 days from now
    }

    const invitationRef = doc(db, "invitations", invitationId)
    await setDoc(invitationRef, invitation)

    console.log(`[createInvitation] Successfully created invitation: ${invitationCode}`)
    return { success: true, invitation }
  } catch (error: any) {
    console.error("[createInvitation] Error:", error)
    return { success: false, error: error.message }
  }
}

export async function getInvitationByCode(code: string): Promise<ClientInvitation | null> {
  try {
    console.log(`[getInvitationByCode] Getting invitation: ${code}`)

    const invitationsRef = collection(db, "invitations")
    const q = query(invitationsRef, where("code", "==", code))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log(`[getInvitationByCode] Invitation not found: ${code}`)
      return null
    }

    const invitationDoc = querySnapshot.docs[0]
    const invitationData = invitationDoc.data() as ClientInvitation
    invitationData.id = invitationDoc.id

    return invitationData
  } catch (error) {
    console.error("[getInvitationByCode] Error:", error)
    return null
  }
}

export async function processLoginInvitation(
  invitationCode: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[processLoginInvitation] Processing invitation ${invitationCode} for user ${userId}`)

    // Get the invitation
    const invitation = await getInvitationByCode(invitationCode)

    if (!invitation) {
      console.log(`[processLoginInvitation] Invitation not found: ${invitationCode}`)
      return { success: false, error: "Invitation not found" }
    }

    if (invitation.status !== "pending") {
      console.log(`[processLoginInvitation] Invitation already processed: ${invitationCode}`)
      return { success: false, error: "Invitation already used or expired" }
    }

    // Check if invitation is expired
    const now = new Date()
    const expiresAt =
      invitation.expiresAt instanceof Timestamp ? invitation.expiresAt.toDate() : new Date(invitation.expiresAt)

    if (now > expiresAt) {
      console.log(`[processLoginInvitation] Invitation expired: ${invitationCode}`)
      return { success: false, error: "Invitation has expired" }
    }

    // Update invitation status
    const invitationRef = doc(db, "invitations", invitation.id)
    await updateDoc(invitationRef, {
      status: "accepted",
      acceptedAt: serverTimestamp(),
      acceptedBy: userId,
    })

    // Create a client request or link user to trainer
    const clientRequestId = `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const clientRequest = {
      id: clientRequestId,
      invitationId: invitation.id,
      invitationCode: invitationCode,
      trainerId: invitation.trainerId,
      userId: userId,
      status: "pending_approval",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const requestRef = doc(db, "client_requests", clientRequestId)
    await setDoc(requestRef, clientRequest)

    console.log(`[processLoginInvitation] Successfully processed invitation: ${invitationCode}`)
    return { success: true }
  } catch (error: any) {
    console.error("[processLoginInvitation] Error:", error)
    return { success: false, error: error.message }
  }
}

export async function linkClientToUser(
  clientId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[linkClientToUser] Linking client ${clientId} to user ${userId}`)

    const clientRef = doc(db, "clients", clientId)
    await updateDoc(clientRef, {
      userId: userId,
      status: "active",
      linkedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    console.log(`[linkClientToUser] Successfully linked client to user`)
    return { success: true }
  } catch (error: any) {
    console.error("[linkClientToUser] Error:", error)
    return { success: false, error: error.message }
  }
}

export async function getClientByUserId(userId: string): Promise<Client | null> {
  try {
    console.log(`[getClientByUserId] Getting client for user: ${userId}`)

    const clientsRef = collection(db, "clients")
    const q = query(clientsRef, where("userId", "==", userId))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log(`[getClientByUserId] No client found for user: ${userId}`)
      return null
    }

    const clientDoc = querySnapshot.docs[0]
    const clientData = clientDoc.data() as Client
    clientData.id = clientDoc.id

    return clientData
  } catch (error) {
    console.error("[getClientByUserId] Error:", error)
    return null
  }
}

export async function approveClientRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[approveClientRequest] Approving client request: ${requestId}`)

    const requestRef = doc(db, "client_requests", requestId)
    await updateDoc(requestRef, {
      status: "approved",
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    console.log(`[approveClientRequest] Successfully approved client request: ${requestId}`)
    return { success: true }
  } catch (error: any) {
    console.error("[approveClientRequest] Error:", error)
    return { success: false, error: error.message }
  }
}
