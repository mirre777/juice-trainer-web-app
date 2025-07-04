import { UnifiedAuthService } from "./unified-auth-service"
import { UnifiedClientService } from "./unified-client-service"
import { db } from "@/lib/firebase/firebase"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore"
import { ErrorType, createError, logError, tryCatch } from "@/lib/utils/error-handler"

export interface ClientUserResult {
  success: boolean
  data?: any
  error?: any
  message?: string
}

export interface ClientUserLinkResult {
  success: boolean
  linkedCount?: number
  error?: any
  message?: string
}

/**
 * Client User Service
 * Handles operations that involve both clients and users
 */
export class ClientUserService {
  private authService = UnifiedAuthService
  private clientService = UnifiedClientService

  /**
   * Link a user account to an existing client
   */
  async linkUserToClient(clientId: string, userId: string): Promise<ClientUserResult> {
    try {
      console.log(`[ClientUserService] Linking user ${userId} to client ${clientId}`)

      // Get current trainer
      const authResult = await this.authService.getCurrentUser()
      if (!authResult.success || !authResult.user) {
        return { success: false, error: "Not authenticated" }
      }

      const trainerId = authResult.user.uid

      // Update client with user ID
      const clientResult = await this.clientService.updateClient(clientId, {
        userId,
        isTemporary: false,
        status: "Active",
      })

      if (!clientResult.success) {
        return { success: false, error: clientResult.error }
      }

      // Update user with trainer relationship
      const userRef = doc(db, "users", userId)
      await updateDoc(userRef, {
        trainerId,
        status: "active",
        updatedAt: serverTimestamp(),
      })

      console.log(`[ClientUserService] Successfully linked user to client`)
      return { success: true, message: "User linked to client successfully" }
    } catch (error) {
      console.error("[ClientUserService] Error linking user to client:", error)
      return { success: false, error }
    }
  }

  /**
   * Get client with user information
   */
  async getClientWithUser(clientId: string): Promise<ClientUserResult> {
    try {
      const clientResult = await this.clientService.getClient(clientId)
      if (!clientResult.success || !clientResult.client) {
        return { success: false, error: "Client not found" }
      }

      const client = clientResult.client
      let userData = null

      if (client.userId) {
        const userRef = doc(db, "users", client.userId)
        const userDoc = await getDoc(userRef)
        if (userDoc.exists()) {
          userData = userDoc.data()
        }
      }

      return {
        success: true,
        data: {
          client,
          user: userData,
        },
      }
    } catch (error) {
      console.error("[ClientUserService] Error getting client with user:", error)
      return { success: false, error }
    }
  }

  /**
   * Create client from user invitation
   */
  async createClientFromInvitation(invitationCode: string, userId: string): Promise<ClientUserResult> {
    try {
      console.log(`[ClientUserService] Creating client from invitation: ${invitationCode}`)

      // Get user data
      const userRef = doc(db, "users", userId)
      const userDoc = await getDoc(userRef)

      if (!userDoc.exists()) {
        return { success: false, error: "User not found" }
      }

      const userData = userDoc.data()

      // Find trainer by invitation code
      const trainersRef = collection(db, "users")
      const trainerQuery = query(trainersRef, where("universalInviteCode", "==", invitationCode))
      const trainerSnapshot = await getDocs(trainerQuery)

      if (trainerSnapshot.empty) {
        return { success: false, error: "Invalid invitation code" }
      }

      const trainerDoc = trainerSnapshot.docs[0]
      const trainerId = trainerDoc.id

      // Create client under trainer
      const clientData = {
        name: userData.name || "New Client",
        email: userData.email || "",
        phone: userData.phone || "",
        userId,
        status: "Active",
        isTemporary: false,
        inviteCode: invitationCode,
      }

      const clientResult = await this.clientService.addClient(clientData)
      if (!clientResult.success) {
        return { success: false, error: clientResult.error }
      }

      // Update user with trainer relationship
      await updateDoc(userRef, {
        trainerId,
        status: "active",
        updatedAt: serverTimestamp(),
      })

      return {
        success: true,
        data: { clientId: clientResult.clientId },
        message: "Client created from invitation successfully",
      }
    } catch (error) {
      console.error("[ClientUserService] Error creating client from invitation:", error)
      return { success: false, error }
    }
  }

  /**
   * Get all clients with their user data
   */
  async getClientsWithUsers(): Promise<ClientUserResult> {
    try {
      const clientsResult = await this.clientService.getClients()
      if (!clientsResult.success || !clientsResult.clients) {
        return { success: false, error: "Failed to get clients" }
      }

      const clientsWithUsers = await Promise.all(
        clientsResult.clients.map(async (client) => {
          let userData = null
          if (client.userId) {
            const userRef = doc(db, "users", client.userId)
            const userDoc = await getDoc(userRef)
            if (userDoc.exists()) {
              userData = userDoc.data()
            }
          }
          return { client, user: userData }
        }),
      )

      return { success: true, data: clientsWithUsers }
    } catch (error) {
      console.error("[ClientUserService] Error getting clients with users:", error)
      return { success: false, error }
    }
  }

  /**
   * Unlink user from client
   */
  async unlinkUserFromClient(clientId: string): Promise<ClientUserResult> {
    try {
      console.log(`[ClientUserService] Unlinking user from client ${clientId}`)

      const clientResult = await this.clientService.updateClient(clientId, {
        userId: "",
        isTemporary: true,
        status: "Pending",
      })

      if (!clientResult.success) {
        return { success: false, error: clientResult.error }
      }

      return { success: true, message: "User unlinked from client successfully" }
    } catch (error) {
      console.error("[ClientUserService] Error unlinking user from client:", error)
      return { success: false, error }
    }
  }

  /**
   * Link pending clients with existing user accounts based on invitation codes
   */
  static async linkPendingClientsWithUsers(trainerId: string): Promise<ClientUserLinkResult> {
    try {
      console.log(`[ClientUserService] 🔗 Starting linking process for trainer: ${trainerId}`)

      if (!trainerId) {
        return {
          success: false,
          error: createError(
            ErrorType.API_MISSING_PARAMS,
            null,
            { function: "linkPendingClientsWithUsers" },
            "Trainer ID is required",
          ),
        }
      }

      // Get all users with invitation codes
      const usersRef = collection(db, "users")
      const userQuery = query(usersRef, where("inviteCode", "!=", ""))

      const [usersSnapshot, usersError] = await tryCatch(() => getDocs(userQuery), ErrorType.DB_READ_FAILED, {
        function: "linkPendingClientsWithUsers",
        trainerId,
      })

      if (usersError || !usersSnapshot) {
        return { success: false, error: usersError }
      }

      console.log(`[ClientUserService] Found ${usersSnapshot.size} users with invitation codes`)

      // Map of invitation codes to user IDs for faster lookup
      const invitationCodeMap = new Map<string, string>()

      usersSnapshot.forEach((userDoc) => {
        const userData = userDoc.data()
        if (userData.inviteCode) {
          console.log(`[ClientUserService] User ${userDoc.id} has invitation code: ${userData.inviteCode}`)
          invitationCodeMap.set(userData.inviteCode, userDoc.id)
        }
      })

      // Get all clients for this trainer
      const clientsCollectionRef = collection(db, "users", trainerId, "clients")
      const [clientsSnapshot, clientsError] = await tryCatch(
        () => getDocs(clientsCollectionRef),
        ErrorType.DB_READ_FAILED,
        { function: "linkPendingClientsWithUsers", trainerId },
      )

      if (clientsError || !clientsSnapshot) {
        return { success: false, error: clientsError }
      }

      console.log(`[ClientUserService] Found ${clientsSnapshot.size} clients for trainer ${trainerId}`)

      let linkedCount = 0

      // For each client, check if there's a user with a matching invitation code
      for (const clientDoc of clientsSnapshot.docs) {
        const clientData = clientDoc.data()
        const clientId = clientDoc.id

        // Skip if already has userId or no invite code
        if (clientData.userId || !clientData.inviteCode) {
          continue
        }

        console.log(`[ClientUserService] Checking client ${clientId} with invite code: ${clientData.inviteCode}`)

        // Check if we have a user with this invitation code
        const userId = invitationCodeMap.get(clientData.inviteCode)

        if (userId) {
          console.log(`[ClientUserService] Found matching user ${userId} for client ${clientId}`)

          // Update the client document with the user ID
          const [, updateClientError] = await tryCatch(
            () =>
              updateDoc(clientDoc.ref, {
                userId: userId,
                status: "Active",
                isTemporary: false,
                updatedAt: serverTimestamp(),
              }),
            ErrorType.DB_WRITE_FAILED,
            { function: "linkPendingClientsWithUsers", trainerId, clientId, userId },
          )

          if (updateClientError) {
            console.error(`[ClientUserService] Error updating client ${clientId}:`, updateClientError)
            continue
          }

          console.log(`[ClientUserService] Updated client ${clientId} with user ID ${userId}`)

          // Add the trainer to the user's trainers list
          const userRef = doc(db, "users", userId)
          const [, updateUserError] = await tryCatch(
            () =>
              updateDoc(userRef, {
                trainers: arrayUnion(trainerId),
                updatedAt: serverTimestamp(),
              }),
            ErrorType.DB_WRITE_FAILED,
            { function: "linkPendingClientsWithUsers", trainerId, userId },
          )

          if (updateUserError) {
            console.error(`[ClientUserService] Error updating user ${userId}:`, updateUserError)
            continue
          }

          console.log(`[ClientUserService] Added trainer ${trainerId} to user ${userId} trainers list`)
          linkedCount++
        }
      }

      console.log(`[ClientUserService] ✅ Completed linking process. Linked ${linkedCount} clients.`)

      return {
        success: true,
        linkedCount,
        message: `Successfully linked ${linkedCount} clients with user accounts`,
      }
    } catch (error: any) {
      const appError = createError(
        ErrorType.UNKNOWN_ERROR,
        error,
        { function: "linkPendingClientsWithUsers", trainerId },
        "Unexpected error linking clients with users",
      )
      logError(appError)
      return { success: false, error: appError }
    }
  }

  /**
   * Check if a user already has a client profile with a trainer
   */
  static async checkExistingClientProfile(
    userId: string,
    trainerId: string,
  ): Promise<{ exists: boolean; clientId?: string; error?: any }> {
    try {
      if (!userId || !trainerId) {
        return {
          exists: false,
          error: createError(
            ErrorType.API_MISSING_PARAMS,
            null,
            { function: "checkExistingClientProfile" },
            "User ID and trainer ID are required",
          ),
        }
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
    } catch (error: any) {
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

  /**
   * Get user data by user ID
   */
  static async getUserData(userId: string): Promise<{ success: boolean; userData?: any; error?: any }> {
    try {
      if (!userId) {
        return {
          success: false,
          error: createError(ErrorType.API_MISSING_PARAMS, null, { function: "getUserData" }, "User ID is required"),
        }
      }

      const userRef = doc(db, "users", userId)
      const [userDoc, docError] = await tryCatch(() => getDoc(userRef), ErrorType.DB_READ_FAILED, {
        function: "getUserData",
        userId,
      })

      if (docError || !userDoc) {
        return { success: false, error: docError }
      }

      if (!userDoc.exists()) {
        return {
          success: false,
          error: createError(
            ErrorType.DB_DOCUMENT_NOT_FOUND,
            null,
            { function: "getUserData", userId },
            "User not found",
          ),
        }
      }

      return { success: true, userData: userDoc.data() }
    } catch (error: any) {
      const appError = createError(
        ErrorType.UNKNOWN_ERROR,
        error,
        { function: "getUserData", userId },
        "Unexpected error getting user data",
      )
      logError(appError)
      return { success: false, error: appError }
    }
  }
}

export const clientUserService = new ClientUserService()
