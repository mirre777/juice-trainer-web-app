import { db } from "./firebase"
import { collection, doc, getDocs, updateDoc, getDoc } from "firebase/firestore"

export interface LinkingResult {
  success: boolean
  clientsProcessed: number
  clientsLinked: number
  errors: string[]
  details: Array<{
    clientId: string
    clientName: string
    clientEmail: string
    userId?: string
    action: "linked" | "already_linked" | "no_match" | "error"
    error?: string
  }>
}

export class ClientLinkingService {
  /**
   * Links client documents with user accounts for a specific trainer
   * Matches based on email address and updates client documents with userId
   */
  async linkClientsWithUsers(trainerId: string): Promise<LinkingResult> {
    const result: LinkingResult = {
      success: false,
      clientsProcessed: 0,
      clientsLinked: 0,
      errors: [],
      details: [],
    }

    try {
      console.log(`[ClientLinkingService] Starting linking process for trainer: ${trainerId}`)

      // Step 1: Get all clients for this trainer
      const clientsRef = collection(db, "users", trainerId, "clients")
      const clientsSnapshot = await getDocs(clientsRef)

      console.log(`[ClientLinkingService] Found ${clientsSnapshot.size} client documents`)

      // Step 2: Get all users to create email-to-userId mapping
      const usersRef = collection(db, "users")
      const usersSnapshot = await getDocs(usersRef)

      // Create email to userId mapping
      const emailToUserIdMap = new Map<string, string>()
      usersSnapshot.forEach((userDoc) => {
        const userData = userDoc.data()
        if (userData.email) {
          emailToUserIdMap.set(userData.email.toLowerCase().trim(), userDoc.id)
        }
      })

      console.log(`[ClientLinkingService] Created mapping for ${emailToUserIdMap.size} user emails`)

      // Step 3: Process each client document
      for (const clientDoc of clientsSnapshot.docs) {
        const clientData = clientDoc.data()
        const clientId = clientDoc.id
        result.clientsProcessed++

        const detail = {
          clientId,
          clientName: clientData.name || "Unknown",
          clientEmail: clientData.email || "No email",
          action: "error" as const,
          error: undefined as string | undefined,
        }

        try {
          // Skip if already has userId
          if (clientData.userId) {
            detail.action = "already_linked"
            detail.userId = clientData.userId
            console.log(`[ClientLinkingService] Client ${clientId} already has userId: ${clientData.userId}`)
            result.details.push(detail)
            continue
          }

          // Skip if no email
          if (!clientData.email) {
            detail.action = "no_match"
            detail.error = "No email address in client document"
            console.log(`[ClientLinkingService] Client ${clientId} has no email address`)
            result.details.push(detail)
            continue
          }

          const clientEmail = clientData.email.toLowerCase().trim()
          const userId = emailToUserIdMap.get(clientEmail)

          if (!userId) {
            detail.action = "no_match"
            detail.error = "No user account found with matching email"
            console.log(`[ClientLinkingService] No user found for email: ${clientEmail}`)
            result.details.push(detail)
            continue
          }

          // Verify the user document exists and has this trainer in their trainers array
          const userDoc = await getDoc(doc(db, "users", userId))
          if (!userDoc.exists()) {
            detail.action = "no_match"
            detail.error = "User document does not exist"
            console.log(`[ClientLinkingService] User document ${userId} does not exist`)
            result.details.push(detail)
            continue
          }

          const userData = userDoc.data()
          const userTrainers = userData.trainers || []

          if (!userTrainers.includes(trainerId)) {
            detail.action = "no_match"
            detail.error = "User does not have this trainer in their trainers array"
            console.log(`[ClientLinkingService] User ${userId} does not have trainer ${trainerId} in trainers array`)
            result.details.push(detail)
            continue
          }

          // Link the client with the user
          await updateDoc(clientDoc.ref, {
            userId: userId,
            updatedAt: new Date(),
          })

          detail.action = "linked"
          detail.userId = userId
          result.clientsLinked++

          console.log(`[ClientLinkingService] ✅ Linked client ${clientId} (${clientData.name}) with user ${userId}`)
          result.details.push(detail)
        } catch (error) {
          detail.error = error instanceof Error ? error.message : "Unknown error"
          result.errors.push(`Client ${clientId}: ${detail.error}`)
          console.error(`[ClientLinkingService] Error processing client ${clientId}:`, error)
          result.details.push(detail)
        }
      }

      result.success = result.errors.length === 0

      console.log(`[ClientLinkingService] ✅ Linking complete:`, {
        processed: result.clientsProcessed,
        linked: result.clientsLinked,
        errors: result.errors.length,
      })

      return result
    } catch (error) {
      console.error(`[ClientLinkingService] Fatal error:`, error)
      result.errors.push(error instanceof Error ? error.message : "Unknown fatal error")
      return result
    }
  }

  /**
   * Links a specific client with a user account
   */
  async linkSpecificClient(
    trainerId: string,
    clientId: string,
    userId: string,
  ): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      console.log(`[ClientLinkingService] Linking specific client ${clientId} with user ${userId}`)

      // Verify client exists
      const clientRef = doc(db, "users", trainerId, "clients", clientId)
      const clientDoc = await getDoc(clientRef)

      if (!clientDoc.exists()) {
        return { success: false, error: "Client document not found" }
      }

      // Verify user exists
      const userRef = doc(db, "users", userId)
      const userDoc = await getDoc(userRef)

      if (!userDoc.exists()) {
        return { success: false, error: "User document not found" }
      }

      // Update client with userId
      await updateDoc(clientRef, {
        userId: userId,
        updatedAt: new Date(),
      })

      console.log(`[ClientLinkingService] ✅ Successfully linked client ${clientId} with user ${userId}`)
      return { success: true }
    } catch (error) {
      console.error(`[ClientLinkingService] Error linking specific client:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Get linking status for a trainer's clients
   */
  async getLinkingStatus(trainerId: string): Promise<{
    totalClients: number
    linkedClients: number
    unlinkedClients: number
    clientsWithoutEmail: number
    details: Array<{
      clientId: string
      name: string
      email?: string
      userId?: string
      isLinked: boolean
    }>
  }> {
    try {
      const clientsRef = collection(db, "users", trainerId, "clients")
      const clientsSnapshot = await getDocs(clientsRef)

      let linkedClients = 0
      let unlinkedClients = 0
      let clientsWithoutEmail = 0
      const details: Array<{
        clientId: string
        name: string
        email?: string
        userId?: string
        isLinked: boolean
      }> = []

      clientsSnapshot.forEach((clientDoc) => {
        const clientData = clientDoc.data()
        const isLinked = !!clientData.userId
        const hasEmail = !!clientData.email

        if (isLinked) {
          linkedClients++
        } else {
          unlinkedClients++
        }

        if (!hasEmail) {
          clientsWithoutEmail++
        }

        details.push({
          clientId: clientDoc.id,
          name: clientData.name || "Unknown",
          email: clientData.email,
          userId: clientData.userId,
          isLinked,
        })
      })

      return {
        totalClients: clientsSnapshot.size,
        linkedClients,
        unlinkedClients,
        clientsWithoutEmail,
        details,
      }
    } catch (error) {
      console.error(`[ClientLinkingService] Error getting linking status:`, error)
      return {
        totalClients: 0,
        linkedClients: 0,
        unlinkedClients: 0,
        clientsWithoutEmail: 0,
        details: [],
      }
    }
  }
}

// Export singleton instance
export const clientLinkingService = new ClientLinkingService()
