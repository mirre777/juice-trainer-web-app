import { UnifiedAuthService } from "./unified-auth-service"
import { UnifiedClientService } from "./unified-client-service"
import type { Client } from "@/types/client"

/**
 * Client User Service
 * Bridges client and user operations
 */
export class ClientUserService {
  private authService = UnifiedAuthService
  private clientService = UnifiedClientService

  /**
   * Get clients for current user
   */
  async getClientsForCurrentUser() {
    const authResult = await this.authService.getCurrentUser()
    if (!authResult.success) {
      return { success: false, error: authResult.error }
    }

    return await this.clientService.getClients()
  }

  /**
   * Add client for current user
   */
  async addClientForCurrentUser(clientData: {
    name: string
    email?: string
    phone?: string
    goal?: string
    program?: string
    notes?: string
  }) {
    const authResult = await this.authService.getCurrentUser()
    if (!authResult.success) {
      return { success: false, error: authResult.error }
    }

    return await this.clientService.addClient(clientData)
  }

  /**
   * Update client for current user
   */
  async updateClientForCurrentUser(clientId: string, updates: Partial<Client>) {
    const authResult = await this.authService.getCurrentUser()
    if (!authResult.success) {
      return { success: false, error: authResult.error }
    }

    return await this.clientService.updateClient(clientId, updates)
  }

  /**
   * Delete client for current user
   */
  async deleteClientForCurrentUser(clientId: string) {
    const authResult = await this.authService.getCurrentUser()
    if (!authResult.success) {
      return { success: false, error: authResult.error }
    }

    return await this.clientService.deleteClient(clientId)
  }

  /**
   * Get specific client for current user
   */
  async getClientForCurrentUser(clientId: string) {
    const authResult = await this.authService.getCurrentUser()
    if (!authResult.success) {
      return { success: false, error: authResult.error }
    }

    return await this.clientService.getClient(clientId)
  }
}

export const clientUserService = new ClientUserService()
