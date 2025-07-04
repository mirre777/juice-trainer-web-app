/**
 * Unified Client Service
 *
 * Single source of truth for all client operations across the app.
 * Uses API with cookies for authentication consistently.
 */

import type { Client } from "@/types/client"
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
} from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { ErrorType, createError, logError, tryCatch } from "@/lib/utils/error-handler"
import { UnifiedAuthService } from "./unified-auth-service"

export interface ClientResult {
  success: boolean
  client?: Client
  clients?: Client[]
  clientId?: string
  error?: any
  message?: string
}

/**
 * Unified Client Service
 * Single source of truth for all client operations
 * Uses UnifiedAuthService for consistent authentication
 */
export class UnifiedClientService {
  /**
   * Get all clients for the current authenticated trainer
   */
  static async getClients(): Promise<ClientResult> {
    try {
      console.log("[UnifiedClient] 🚀 Fetching clients...")

      // Get current user using unified auth service
      const authResult = await UnifiedAuthService.getCurrentUser()
      if (!authResult.success || !authResult.user) {
        return { success: false, error: authResult.error }
      }

      const trainerId = authResult.user.uid
      console.log("[UnifiedClient] 📍 Trainer ID:", trainerId)

      // Fetch clients from Firestore
      const clientsCollectionRef = collection(db, "users", trainerId, "clients")
      const [querySnapshot, queryError] = await tryCatch(
        () => getDocs(clientsCollectionRef),
        ErrorType.DB_READ_FAILED,
        { function: "getClients", trainerId },
      )

      if (queryError || !querySnapshot) {
        return { success: false, error: queryError }
      }

      console.log(`[UnifiedClient] 📊 Found ${querySnapshot.size} client documents`)

      const clients: Client[] = []

      for (const docSnapshot of querySnapshot.docs) {
        const clientData = docSnapshot.data()

        // Validate client data
        if (!this.isValidClientData(clientData)) {
          console.log(`[UnifiedClient] ❌ Skipping invalid client: ${docSnapshot.id}`)
          continue
        }

        // Map client data with user info if available
        const client = await this.mapClientDataWithUserInfo(docSnapshot.id, clientData)
        if (client) {
          clients.push(client)
        }
      }

      // Sort by creation date
      clients.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(0)
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(0)
        return dateB.getTime() - dateA.getTime()
      })

      console.log(`[UnifiedClient] ✅ Successfully fetched ${clients.length} clients`)
      return { success: true, clients }
    } catch (error: any) {
      const appError = createError(
        ErrorType.UNKNOWN_ERROR,
        error,
        { function: "getClients" },
        "Unexpected error fetching clients",
      )
      logError(appError)
      return { success: false, error: appError }
    }
  }

  /**
   * Get a single client by ID
   */
  static async getClient(clientId: string): Promise<ClientResult> {
    try {
      console.log("[UnifiedClient] 🔍 Fetching client:", clientId)

      // Get current user
      const authResult = await UnifiedAuthService.getCurrentUser()
      if (!authResult.success || !authResult.user) {
        return { success: false, error: authResult.error }
      }

      const trainerId = authResult.user.uid
      const clientRef = doc(db, "users", trainerId, "clients", clientId)

      const [clientDoc, docError] = await tryCatch(() => getDoc(clientRef), ErrorType.DB_READ_FAILED, {
        function: "getClient",
        trainerId,
        clientId,
      })

      if (docError || !clientDoc) {
        return { success: false, error: docError }
      }

      if (!clientDoc.exists()) {
        return {
          success: false,
          error: createError(ErrorType.DB_DOCUMENT_NOT_FOUND, null, { clientId }, "Client not found"),
        }
      }

      const client = await this.mapClientDataWithUserInfo(clientDoc.id, clientDoc.data())
      if (!client) {
        return {
          success: false,
          error: createError(ErrorType.DB_READ_FAILED, null, { clientId }, "Invalid client data"),
        }
      }

      console.log("[UnifiedClient] ✅ Client fetched successfully:", client.name)
      return { success: true, client }
    } catch (error: any) {
      const appError = createError(
        ErrorType.UNKNOWN_ERROR,
        error,
        { function: "getClient", clientId },
        "Unexpected error fetching client",
      )
      logError(appError)
      return { success: false, error: appError }
    }
  }

  /**
   * Add a new client
   */
  static async addClient(clientData: {
    name: string
    email?: string
    phone?: string
    goal?: string
    program?: string
    notes?: string
  }): Promise<ClientResult> {
    try {
      console.log("[UnifiedClient] 📝 Adding new client:", clientData.name)

      // Get current user
      const authResult = await UnifiedAuthService.getCurrentUser()
      if (!authResult.success || !authResult.user) {
        return { success: false, error: authResult.error }
      }

      const trainerId = authResult.user.uid

      // Check for duplicate email if provided
      if (clientData.email) {
        const duplicateCheck = await this.checkDuplicateEmail(trainerId, clientData.email)
        if (duplicateCheck.exists) {
          return {
            success: false,
            error: createError(
              ErrorType.DB_CONSTRAINT_VIOLATION,
              null,
              { email: clientData.email },
              "Client with this email already exists",
            ),
          }
        }
      }

      // Generate invite code
      const inviteCode = this.generateInviteCode()

      // Prepare client document
      const newClientData = {
        name: clientData.name,
        email: clientData.email || "",
        phone: clientData.phone || "",
        goal: clientData.goal || "",
        program: clientData.program || "",
        notes: clientData.notes || "",
        status: "Pending",
        progress: 0,
        completion: 0,
        sessions: { completed: 0, total: 0 },
        inviteCode,
        isTemporary: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      // Add to Firestore
      const clientsCollectionRef = collection(db, "users", trainerId, "clients")
      const [docRef, addError] = await tryCatch(
        () => addDoc(clientsCollectionRef, newClientData),
        ErrorType.DB_WRITE_FAILED,
        { function: "addClient", trainerId },
      )

      if (addError || !docRef) {
        return { success: false, error: addError }
      }

      console.log("[UnifiedClient] ✅ Client added successfully:", docRef.id)
      return {
        success: true,
        clientId: docRef.id,
        message: "Client added successfully",
      }
    } catch (error: any) {
      const appError = createError(
        ErrorType.UNKNOWN_ERROR,
        error,
        { function: "addClient" },
        "Unexpected error adding client",
      )
      logError(appError)
      return { success: false, error: appError }
    }
  }

  /**
   * Update a client
   */
  static async updateClient(clientId: string, updates: Partial<Client>): Promise<ClientResult> {
    try {
      console.log("[UnifiedClient] 📝 Updating client:", clientId)

      // Get current user
      const authResult = await UnifiedAuthService.getCurrentUser()
      if (!authResult.success || !authResult.user) {
        return { success: false, error: authResult.error }
      }

      const trainerId = authResult.user.uid
      const clientRef = doc(db, "users", trainerId, "clients", clientId)

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      }

      const [, updateError] = await tryCatch(() => updateDoc(clientRef, updateData), ErrorType.DB_WRITE_FAILED, {
        function: "updateClient",
        trainerId,
        clientId,
      })

      if (updateError) {
        return { success: false, error: updateError }
      }

      console.log("[UnifiedClient] ✅ Client updated successfully:", clientId)
      return { success: true, message: "Client updated successfully" }
    } catch (error: any) {
      const appError = createError(
        ErrorType.UNKNOWN_ERROR,
        error,
        { function: "updateClient", clientId },
        "Unexpected error updating client",
      )
      logError(appError)
      return { success: false, error: appError }
    }
  }

  /**
   * Delete a client
   */
  static async deleteClient(clientId: string): Promise<ClientResult> {
    try {
      console.log("[UnifiedClient] 🗑️ Deleting client:", clientId)

      // Get current user
      const authResult = await UnifiedAuthService.getCurrentUser()
      if (!authResult.success || !authResult.user) {
        return { success: false, error: authResult.error }
      }

      const trainerId = authResult.user.uid
      const clientRef = doc(db, "users", trainerId, "clients", clientId)

      const [, deleteError] = await tryCatch(() => deleteDoc(clientRef), ErrorType.DB_DELETE_FAILED, {
        function: "deleteClient",
        trainerId,
        clientId,
      })

      if (deleteError) {
        return { success: false, error: deleteError }
      }

      console.log("[UnifiedClient] ✅ Client deleted successfully:", clientId)
      return { success: true, message: "Client deleted successfully" }
    } catch (error: any) {
      const appError = createError(
        ErrorType.UNKNOWN_ERROR,
        error,
        { function: "deleteClient", clientId },
        "Unexpected error deleting client",
      )
      logError(appError)
      return { success: false, error: appError }
    }
  }

  /**
   * Subscribe to real-time client updates
   */
  static subscribeToClients(callback: (result: ClientResult) => void): () => void {
    console.log("[UnifiedClient] 🔗 Setting up real-time subscription...")

    // Get current user first
    UnifiedAuthService.getCurrentUser()
      .then((authResult) => {
        if (!authResult.success || !authResult.user) {
          callback({ success: false, error: authResult.error })
          return
        }

        const trainerId = authResult.user.uid
        const clientsRef = collection(db, "users", trainerId, "clients")

        const unsubscribe = onSnapshot(
          clientsRef,
          async (querySnapshot) => {
            console.log(`[UnifiedClient] 📊 Real-time update: ${querySnapshot.size} documents`)

            const clients: Client[] = []

            for (const docSnapshot of querySnapshot.docs) {
              const clientData = docSnapshot.data()

              if (this.isValidClientData(clientData)) {
                const client = await this.mapClientDataWithUserInfo(docSnapshot.id, clientData)
                if (client) {
                  clients.push(client)
                }
              }
            }

            // Sort by creation date
            clients.sort((a, b) => {
              const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(0)
              const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(0)
              return dateB.getTime() - dateA.getTime()
            })

            callback({ success: true, clients })
          },
          (error) => {
            console.error("[UnifiedClient] ❌ Real-time subscription error:", error)
            const appError = createError(
              ErrorType.DB_READ_FAILED,
              error,
              { function: "subscribeToClients", trainerId },
              "Real-time subscription failed",
            )
            callback({ success: false, error: appError })
          },
        )

        return unsubscribe
      })
      .catch((error) => {
        callback({ success: false, error })
      })

    // Return empty function if auth fails
    return () => {}
  }

  // Private helper methods

  private static isValidClientData(data: any): boolean {
    return data && typeof data === "object" && typeof data.name === "string" && !data.name.includes("channel?VER=")
  }

  private static async mapClientDataWithUserInfo(id: string, data: any): Promise<Client | null> {
    if (!this.isValidClientData(data)) {
      return null
    }

    // Get user data if userId exists
    let userData = null
    if (data.userId) {
      try {
        const userRef = doc(db, "users", data.userId)
        const userDoc = await getDoc(userRef)
        if (userDoc.exists()) {
          userData = userDoc.data()
        }
      } catch (error) {
        console.error(`[UnifiedClient] Error fetching user data for ${data.userId}:`, error)
      }
    }

    return {
      id,
      name: userData?.name || data.name || "Unnamed Client",
      initials: this.getInitials(userData?.name || data.name || "UC"),
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
      createdAt: data.createdAt?.toDate?.() || new Date(),
      inviteCode: data.inviteCode || "",
      userId: data.userId || "",
      phone: userData?.phone || data.phone || "",
      hasLinkedAccount: !!(data.userId && userData),
      userStatus: userData?.status || "unknown",
    } as Client
  }

  private static getInitials(name: string): string {
    if (!name || typeof name !== "string") return "UC"

    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  private static async checkDuplicateEmail(
    trainerId: string,
    email: string,
  ): Promise<{ exists: boolean; client?: Client }> {
    try {
      const clientsRef = collection(db, "users", trainerId, "clients")
      const q = query(clientsRef, where("email", "==", email.toLowerCase().trim()))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const clientDoc = querySnapshot.docs[0]
        const client = await this.mapClientDataWithUserInfo(clientDoc.id, clientDoc.data())
        return { exists: true, client: client || undefined }
      }

      return { exists: false }
    } catch (error) {
      console.error("[UnifiedClient] Error checking duplicate email:", error)
      return { exists: false }
    }
  }

  private static generateInviteCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }
}
