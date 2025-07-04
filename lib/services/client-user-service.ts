import { UnifiedAuthService } from "./unified-auth-service"
import { UnifiedClientService } from "./unified-client-service"
import type { User } from "@/types/index"

/**
 * @deprecated Use UnifiedAuthService and UnifiedClientService instead
 * This service is maintained for backward compatibility
 */
export class ClientUserService {
  private authService: UnifiedAuthService
  private clientService: UnifiedClientService

  constructor() {
    this.authService = new UnifiedAuthService()
    this.clientService = new UnifiedClientService()

    console.warn("ClientUserService is deprecated. Use UnifiedAuthService and UnifiedClientService directly.")
  }

  async getCurrentUser(): Promise<User | null> {
    return this.authService.getCurrentUser()
  }

  async getClients(userId: string) {
    return this.clientService.getClients(userId)
  }

  async addClient(userId: string, clientData: any) {
    return this.clientService.addClient(userId, clientData)
  }

  async updateClient(userId: string, clientId: string, updates: any) {
    return this.clientService.updateClient(userId, clientId, updates)
  }

  async deleteClient(userId: string, clientId: string) {
    return this.clientService.deleteClient(userId, clientId)
  }
}

export const clientUserService = new ClientUserService()
