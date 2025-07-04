import { UnifiedAuthService } from "./unified-auth-service"
import { UnifiedClientService } from "./unified-client-service"
import { db } from "@/lib/firebase/firebase"
import { doc, getDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore"

export interface ClientUserResult {
  success: boolean
  data?: any
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
}

export const clientUserService = new ClientUserService()
