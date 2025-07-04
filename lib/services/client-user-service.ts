import { UnifiedAuthService } from "./unified-auth-service"
import { UnifiedClientService } from "./unified-client-service"

export interface ClientUser {
  id: string
  email: string
  name: string
  role: "trainer" | "client"
  trainerId?: string
  createdAt: Date
  updatedAt: Date
}

export class ClientUserService {
  private authService = new UnifiedAuthService()
  private clientService = new UnifiedClientService()

  async getCurrentUser(): Promise<ClientUser | null> {
    try {
      const user = await this.authService.getCurrentUser()
      if (!user) return null

      return {
        id: user.uid,
        email: user.email || "",
        name: user.displayName || user.email?.split("@")[0] || "",
        role: "trainer", // Default role, can be enhanced later
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    } catch (error) {
      console.error("Error getting current user:", error)
      return null
    }
  }

  async getUserClients(userId: string) {
    return this.clientService.getClients(userId)
  }

  async addClientForUser(userId: string, clientData: any) {
    return this.clientService.addClient(userId, clientData)
  }

  async updateClientForUser(userId: string, clientId: string, updates: any) {
    return this.clientService.updateClient(userId, clientId, updates)
  }

  async deleteClientForUser(userId: string, clientId: string) {
    return this.clientService.deleteClient(userId, clientId)
  }

  async getClientById(userId: string, clientId: string) {
    return this.clientService.getClientById(userId, clientId)
  }
}
