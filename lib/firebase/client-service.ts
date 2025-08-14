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
  getCountFromServer,
  DocumentReference,
  DocumentData,
} from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { Client, ClientStatus } from "@/types/client"
import { getUserById } from "@/lib/firebase/user-service"

function getInitials(name: string): string {
  if (!name || typeof name !== "string") return "UC"

  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)
}

export function isValidClientData(data: any): boolean {
  return data && typeof data === "object" && typeof data.name === "string" && !data.name.includes("channel?VER=")
}

export async function getClient(trainerId: string, clientId: string): Promise<Client | null> {
  try {
    if (!clientId || !trainerId) {
      console.error("[getClient] Client ID and trainer ID are required")
      return null
    }

    const clientRef = doc(db, `/users/${trainerId}/clients/${clientId}`)
    const clientDoc = await getDoc(clientRef)

    if (!clientDoc.exists()) {
      return null
    }

    const clientData = clientDoc.data()
    console.log(clientData)
    const client = mapClientData(clientId, clientData)

    return client
  } catch (error) {
    console.error(`[getClient] Error fetching client ${clientId}:`, error)
    return null
  }
}

export async function createClient(
  trainerId: string,
  clientData: Partial<Client>,
): Promise<{ success: boolean; clientId?: string; error?: any }> {
  try {
    if (!trainerId) {
      return { success: false, error: "Trainer ID is required" }
    }

    const clientsRef = collection(db, "users", trainerId, "clients")
    const newClient = {
      ...clientData,
      trainerId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: clientData.status || "Pending",
      notes: clientData.notes || "",
      email: clientData.email || "",
      goal: clientData.goal || "",
      program: clientData.program || "",
      phone: clientData.phone || "",
    }

    const docRef = await addDoc(clientsRef, newClient)

    return { success: true, clientId: docRef.id }
  } catch (error) {
    console.error("[createClient] Error creating client:", error)
    return { success: false, error }
  }
}

export async function mapClientDataWithUserInfo(id: string, data: any): Promise<Client | null> {
  if (!isValidClientData(data)) {
    console.error("Invalid client data detected:", data)
    return null
  }

  let userData = null
  if (data.userId) {
    userData = await getUserDataFromUserId(data.userId)
  }

  const mergedData = {
    id: id,
    name: data.name || userData?.name || "Unnamed Client",
    initials: getInitials(data.name || userData?.name || "UC"),
    status: data.status || "Pending",
    progress: data.progress || 0,
    sessions: data.sessions || { completed: 0, total: 0 },
    completion: data.completion || 0,
    notes: data.notes || "",
    email: userData?.email || data.email || "",
    goal: data.goal || "",
    program: data.program || "",
    createdAt: data.createdAt,
    inviteCode: data.inviteCode || "",
    userId: data.userId || "",
    phone: userData?.phone || data.phone || "",
    userStatus: userData?.status || "unknown",
    hasLinkedAccount: !!(data.userId && userData),
    workoutDays: data.workoutDays || { monday: false, tuesday: false, wednesday: false, thursday: false, friday: false, saturday: false, sunday: false },
    _lastUpdated: Date.now(),
  } as Client

  return mergedData
}

async function getUserDataFromUserId(userId: string): Promise<any> {
  try {
    if (!userId) {
      return null
    }

    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      const userData = userDoc.data()
      return userData
    } else {
      return null
    }
  } catch (error) {
    console.error(`[getUserDataFromUserId] Error getting user data for ${userId}:`, error)
    return null
  }
}

export function mapClientData(id: string, data: any): Client | null {
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
    workoutDays: data.workoutDays || { monday: false, tuesday: false, wednesday: false, thursday: false, friday: false, saturday: false, sunday: false },
    _lastUpdated: Date.now(),
  } as Client
}

export async function getTotalClients(trainerId: string): Promise<number> {
  try {
    if (!trainerId) {
      return 0
    }

    const clientsCollectionRef = collection(db, "users", trainerId, "clients")
    const simpleQuery = await getCountFromServer(clientsCollectionRef)

    return simpleQuery.data().count
  } catch (error) {
    console.error(`[getTotalClients] Error:`, error)
    return 0
  }
}

export async function fetchClients(trainerId: string): Promise<Client[]> {
  try {
    const clientsCollectionRef = collection(db, `users/${trainerId}/clients`)
    const simpleSnapshot = await getDocs(clientsCollectionRef)

    if (simpleSnapshot.size === 0) {
      return []
    }

    const clients: Client[] = []

    for (const docSnapshot of simpleSnapshot.docs) {
      const clientId = docSnapshot.id
      const clientData = docSnapshot.data()

      const client = await mapClientDataWithUserInfo(clientId, clientData)

      if (client) {
        clients.push(client)
      }
    }

    return clients
  } catch (error) {
    console.error(`[fetchClients] Error:`, error)
    return []
  }
}

export async function checkDuplicateEmail(
  trainerId: string,
  email: string,
): Promise<{ exists: boolean; client?: Client; error?: any }> {
  try {
    if (!trainerId || !email) {
      return { exists: false }
    }

    const clientsCollectionRef = collection(db, "users", trainerId, "clients")
    const q = query(clientsCollectionRef, where("email", "==", email.toLowerCase().trim()))

    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const clientDoc = querySnapshot.docs[0]
      const clientData = clientDoc.data()
      const client = mapClientData(clientDoc.id, clientData)

      return { exists: true, client: client || undefined }
    }

    return { exists: false }
  } catch (error) {
    return { exists: false, error }
  }
}

export function subscribeToClients(trainerId: string, callback: (clients: Client[], error?: any) => void): () => void {
  if (!trainerId) {
    callback([], new Error("Trainer ID is required"))
    return () => {}
  }

  try {
    const clientsRef = collection(db, "clients")
    const q = query(clientsRef, where("trainerId", "==", trainerId))

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const clients: Client[] = []

        querySnapshot.forEach((doc) => {
          try {
            const client = mapClientData(doc.id, doc.data())
            if (client) {
              clients.push(client)
            }
          } catch (mappingError) {
            console.error("Error mapping client document:", doc.id, mappingError)
          }
        })

        clients.sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(0)
          const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(0)
          return dateB.getTime() - dateA.getTime()
        })

        callback(clients)
      },
      (error) => {
        console.error("Firestore subscription error:", error)
        callback([], error)
      },
    )

    return unsubscribe
  } catch (error) {
    console.error("Error setting up subscription:", error)
    callback([], error)
    return () => {}
  }
}

export async function getClientsByTrainer(trainerId: string): Promise<{ clients: Client[]; error?: any }> {
  try {
    if (!trainerId) {
      return { clients: [], error: "Trainer ID is required" }
    }

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
        console.error("Error mapping client:", doc.id, mappingError)
      }
    })

    clients.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(0)
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(0)
      return dateB.getTime() - dateA.getTime()
    })

    return { clients }
  } catch (error) {
    return { clients: [], error }
  }
}

export async function addClient(
  trainerId: string,
  clientData: Partial<Client>,
): Promise<{ success: boolean; clientId?: string; error?: any }> {
  try {
    if (!trainerId) {
      return { success: false, error: "Trainer ID is required" }
    }

    const clientsRef = collection(db, "users", trainerId, "clients")
    const newClient = {
      ...clientData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: clientData.status || ClientStatus.Pending,
      notes: clientData.notes || "",
      email: clientData.email || "",
      goal: clientData.goal || "",
      program: clientData.program || "",
      phone: clientData.phone || "",
      inviteCode: clientData.inviteCode || "",
      userId: clientData.userId || "",
      workoutDays: clientData.workoutDays || { monday: false, tuesday: false, wednesday: false, thursday: false, friday: false, saturday: false, sunday: false },
    }

    const docRef = await addDoc(clientsRef, newClient)

    return { success: true, clientId: docRef.id }
  } catch (error) {
    return { success: false, error }
  }
}

export async function updateClient(
  clientId: string,
  updates: Partial<Client>,
): Promise<{ success: boolean; error?: any }> {
  try {
    if (!clientId) {
      return { success: false, error: "Client ID is required" }
    }

    const clientRef = doc(db, "clients", clientId)
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    }

    await updateDoc(clientRef, updateData)

    return { success: true }
  } catch (error) {
    return { success: false, error }
  }
}

export async function deleteClient(clientId: string): Promise<{ success: boolean; error?: any }> {
  try {
    if (!clientId) {
      return { success: false, error: "Client ID is required" }
    }

    const clientRef = doc(db, "clients", clientId)
    await deleteDoc(clientRef)

    return { success: true }
  } catch (error) {
    return { success: false, error }
  }
}

export async function getClientById(clientId: string): Promise<{ client: Client | null; error?: any }> {
  try {
    if (!clientId) {
      return { client: null, error: "Client ID is required" }
    }

    const clientRef = doc(db, "clients", clientId)
    const clientDoc = await getDoc(clientRef)

    if (!clientDoc.exists()) {
      return { client: null }
    }

    const client = mapClientData(clientDoc.id, clientDoc.data())
    return { client }
  } catch (error) {
    return { client: null, error }
  }
}

export async function getTrainerName(trainerId: string): Promise<string> {
  try {
    if (!trainerId) {
      return ""
    }

    const userData = await getUserById(trainerId)

    if (!userData) {
      return ""
    }

    return userData.name || ""
  } catch (error) {
    console.error("Error getting trainer name:", error)
    return ""
  }
}

export function generateInviteLink(inviteCode: string, trainerName: string): string {
  if (!inviteCode) {
    return ""
  }

  const encodedTrainerName = encodeURIComponent(trainerName || "")
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "")

  return `${appUrl}/invite/${inviteCode}?tn=${encodedTrainerName}`
}

export async function processInvitation(
  inviteCode: string,
  userId: string,
): Promise<{ success: boolean; trainerId?: string; clientId?: string; error?: any }> {
  try {
    if (!inviteCode || !userId) {
      return {
        success: false,
        error: new Error("Invite code and user ID are required"),
      }
    }

    const clientsRef = collection(db, "users")
    const trainersSnapshot = await getDocs(clientsRef)

    let clientData = null
    let trainerId = null
    let clientId = null
    let clientRef = null

    for (const trainerDoc of trainersSnapshot.docs) {
      try {
        const trainerClientsRef = collection(db, "users", trainerDoc.id, "clients")
        const q = query(trainerClientsRef, where("inviteCode", "==", inviteCode))

        const clientsSnapshot = await getDocs(q)

        if (!clientsSnapshot.empty) {
          clientData = clientsSnapshot.docs[0].data()
          trainerId = trainerDoc.id
          clientId = clientsSnapshot.docs[0].id
          clientRef = doc(db, "users", trainerDoc.id, "clients", clientId)
          break
        }
      } catch (trainerError) {
        console.error(`Error checking trainer ${trainerDoc.id}:`, trainerError)
      }
    }

    if (!clientData) {
      return { success: false, error: new Error("Invitation not found") }
    }

    await updateDoc(clientRef as DocumentReference<DocumentData, DocumentData>, {
      userId: userId,
      isTemporary: false,
      status: "Active",
      updatedAt: serverTimestamp(),
    })

    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      trainers: arrayUnion(trainerId),
      updatedAt: serverTimestamp(),
    })

    return { success: true, trainerId: trainerId || "", clientId: clientId || "" }
  } catch (error) {
    return {
      success: false,
      error,
    }
  }
}

export async function findClientByInvitationCode(
  inviteCode: string,
): Promise<{ exists: boolean; trainerId?: string; clientId?: string; status?: string; error?: any }> {
  try {
    if (!inviteCode) {
      return { exists: false, error: new Error("Invite code is required") }
    }

    const clientsRef = collection(db, "users")
    const trainersSnapshot = await getDocs(clientsRef)

    for (const trainerDoc of trainersSnapshot.docs) {
      try {
        const trainerClientsRef = collection(db, "users", trainerDoc.id, "clients")
        const q = query(trainerClientsRef, where("inviteCode", "==", inviteCode))

        const clientsSnapshot = await getDocs(q)

        if (!clientsSnapshot.empty) {
          const clientDoc = clientsSnapshot.docs[0]
          const clientData = clientDoc.data()

          return {
            exists: true,
            trainerId: trainerDoc.id,
            clientId: clientDoc.id,
            status: clientData.status,
          }
        }
      } catch (trainerError) {
        console.error(`Error checking trainer ${trainerDoc.id}:`, trainerError)
      }
    }

    return { exists: false }
  } catch (error) {
    return { exists: false, error }
  }
}

export async function checkExistingClientProfile(
  userId: string,
  trainerId: string,
): Promise<{ exists: boolean; clientId?: string; error?: any }> {
  try {
    if (!userId || !trainerId) {
      return { exists: false, error: "User ID and trainer ID are required" }
    }

    const clientsCollectionRef = collection(db, "users", trainerId, "clients")
    const q = query(clientsCollectionRef, where("userId", "==", userId))

    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      return { exists: true, clientId: querySnapshot.docs[0].id }
    }

    return { exists: false }
  } catch (error) {
    return { exists: false, error }
  }
}

export async function replaceTemporaryClient(
  trainerId: string,
  temporaryClientId: string,
  userId: string,
): Promise<{ success: boolean; error?: any }> {
  try {
    if (!trainerId || !temporaryClientId || !userId) {
      return { success: false, error: "Trainer ID, temporary client ID, and user ID are required" }
    }

    const tempClientRef = doc(collection(db, "users", trainerId, "clients"), temporaryClientId)
    const tempClientDoc = await getDoc(tempClientRef)

    if (!tempClientDoc.exists()) {
      return { success: false, error: "Temporary client not found" }
    }

    const tempClientData = tempClientDoc.data()

    const { exists, clientId, error: checkError } = await checkExistingClientProfile(userId, trainerId)

    if (checkError) {
      return { success: false, error: checkError }
    }

    if (exists && clientId) {
      const clientRef = doc(collection(db, "users", trainerId, "clients"), clientId)
      await updateDoc(clientRef, {
        program: tempClientData.program || "",
        goal: tempClientData.goal || "",
        notes: tempClientData.notes || "",
        updatedAt: serverTimestamp(),
      })

      await deleteDoc(tempClientRef)
    } else {
      await updateDoc(tempClientRef, {
        userId: userId,
        isTemporary: false,
        status: "Active",
        updatedAt: serverTimestamp(),
      })
    }

    return { success: true }
  } catch (error) {
    return { success: false, error }
  }
}

export async function linkPendingClientsWithUsers(trainerId: string): Promise<void> {
  try {
    if (!trainerId) {
      return
    }

    const usersRef = collection(db, "users")
    const userQuery = query(usersRef, where("inviteCode", "!=", ""))
    const usersSnapshot = await getDocs(userQuery)

    const invitationCodeMap = new Map<string, string>()

    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data()
      if (userData.inviteCode) {
        invitationCodeMap.set(userData.inviteCode, userDoc.id)
      }
    })

    const clientsCollectionRef = collection(db, "users", trainerId, "clients")
    const clientsSnapshot = await getDocs(clientsCollectionRef)

    for (const clientDoc of clientsSnapshot.docs) {
      const clientData = clientDoc.data()
      const clientId = clientDoc.id

      if (clientData.userId || !clientData.inviteCode) {
        continue
      }

      const userId = invitationCodeMap.get(clientData.inviteCode)

      if (userId) {
        await updateDoc(clientDoc.ref, {
          userId: userId,
          status: "Active",
          isTemporary: false,
          updatedAt: serverTimestamp(),
        })

        const userRef = doc(db, "users", userId)
        await updateDoc(userRef, {
          trainers: arrayUnion(trainerId),
          updatedAt: serverTimestamp(),
        })
      }
    }
  } catch (error) {
    console.error("Error linking pending clients with users:", error)
  }
}

export async function getPendingClients(trainerId: string): Promise<Client[]> {
  try {
    if (!trainerId) {
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

export async function processLoginInvitation(
  invitationCode: string,
  userId: string,
): Promise<{ success: boolean; trainerId?: string; error?: any }> {
  try {
    if (!invitationCode || !userId) {
      return {
        success: false,
        error: new Error("Invitation code and user ID are required"),
      }
    }

    const usersRef = collection(db, "users")
    const q = query(usersRef, where("universalInviteCode", "==", invitationCode))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return {
        success: false,
        error: new Error("Invalid invitation code"),
      }
    }

    const trainerDoc = querySnapshot.docs[0]
    const trainerId = trainerDoc.id

    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      status: "pending_approval",
      invitedBy: trainerId,
      universalInviteCode: invitationCode,
      updatedAt: serverTimestamp(),
    })

    const trainerRef = doc(db, "users", trainerId)

    await updateDoc(trainerRef, {
      pendingUsers: arrayUnion(userId),
      updatedAt: serverTimestamp(),
    })

    return { success: true, trainerId }
  } catch (error) {
    return {
      success: false,
      error,
    }
  }
}
