/**
 * Unified Client Service
 *
 * Single source of truth for all client operations across the app.
 * Uses API with cookies for authentication consistently.
 */

import type { Client } from "@/types/client"
import { authService } from "./unified-auth-service"

export interface ClientResult {
  success: boolean
  clients?: Client[]
  client?: Client
  clientId?: string
  error?: string
}

export interface AddClientData {
  name: string
  email?: string
  phone?: string
  goal?: string
  program?: string
  notes?: string
}

class UnifiedClientService {
  private clientsCache: Client[] = []
  private lastFetchTime: Date | null = null

  /**
   * Fetch all clients for the current user
   */
  async fetchClients(): Promise<ClientResult> {
    try {
      console.log("[UnifiedClientService] Fetching clients via API")

      // Ensure user is authenticated
      const authResult = await authService.getCurrentUser()
      if (!authResult.success) {
        return { success: false, error: "Authentication required" }
      }

      const response = await fetch("/api/clients", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("[UnifiedClientService] API response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[UnifiedClientService] API error:", errorText)
        return { success: false, error: `Failed to fetch clients: ${response.status}` }
      }

      const data = await response.json()
      console.log("[UnifiedClientService] API response data:", {
        success: data.success,
        clientCount: data.clients?.length || 0,
      })

      if (data.success && data.clients && Array.isArray(data.clients)) {
        this.clientsCache = data.clients
        this.lastFetchTime = new Date()

        console.log("[UnifiedClientService] Successfully fetched clients:", data.clients.length)
        return { success: true, clients: data.clients }
      } else {
        console.log("[UnifiedClientService] No clients in response")
        this.clientsCache = []
        return { success: true, clients: [] }
      }
    } catch (error) {
      console.error("[UnifiedClientService] Error fetching clients:", error)
      return { success: false, error: "Failed to fetch clients" }
    }
  }

  /**
   * Get cached clients (if available)
   */
  getCachedClients(): Client[] {
    return this.clientsCache
  }

  /**
   * Get last fetch time
   */
  getLastFetchTime(): Date | null {
    return this.lastFetchTime
  }

  /**
   * Add a new client
   */
  async addClient(clientData: AddClientData): Promise<ClientResult> {
    try {
      console.log("[UnifiedClientService] Adding new client:", clientData.name)

      // Ensure user is authenticated
      const authResult = await authService.getCurrentUser()
      if (!authResult.success) {
        return { success: false, error: "Authentication required" }
      }

      const response = await fetch("/api/clients", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clientData),
      })

      const data = await response.json()
      console.log("[UnifiedClientService] Add client response:", data)

      if (!response.ok) {
        console.error("[UnifiedClientService] Failed to add client:", data.error)
        return { success: false, error: data.error || "Failed to add client" }
      }

      if (data.success || data.clientId) {
        console.log("[UnifiedClientService] Client added successfully:", data.clientId)

        // Refresh clients cache
        await this.fetchClients()

        return { success: true, clientId: data.clientId }
      } else {
        return { success: false, error: "Failed to add client" }
      }
    } catch (error) {
      console.error("[UnifiedClientService] Error adding client:", error)
      return { success: false, error: "Failed to add client" }
    }
  }

  /**
   * Get a single client by ID
   */
  async getClient(clientId: string): Promise<ClientResult> {
    try {
      console.log("[UnifiedClientService] Getting client:", clientId)

      // First check cache
      const cachedClient = this.clientsCache.find((c) => c.id === clientId)
      if (cachedClient) {
        console.log("[UnifiedClientService] Found client in cache")
        return { success: true, client: cachedClient }
      }

      // If not in cache, fetch from API
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        console.error("[UnifiedClientService] Failed to get client:", response.status)
        return { success: false, error: "Client not found" }
      }

      const data = await response.json()

      if (data.success && data.client) {
        console.log("[UnifiedClientService] Client fetched successfully")
        return { success: true, client: data.client }
      } else {
        return { success: false, error: "Client not found" }
      }
    } catch (error) {
      console.error("[UnifiedClientService] Error getting client:", error)
      return { success: false, error: "Failed to get client" }
    }
  }

  /**
   * Update a client
   */
  async updateClient(clientId: string, updates: Partial<Client>): Promise<ClientResult> {
    try {
      console.log("[UnifiedClientService] Updating client:", clientId)

      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("[UnifiedClientService] Failed to update client:", data.error)
        return { success: false, error: data.error || "Failed to update client" }
      }

      if (data.success) {
        console.log("[UnifiedClientService] Client updated successfully")

        // Refresh clients cache
        await this.fetchClients()

        return { success: true }
      } else {
        return { success: false, error: "Failed to update client" }
      }
    } catch (error) {
      console.error("[UnifiedClientService] Error updating client:", error)
      return { success: false, error: "Failed to update client" }
    }
  }

  /**
   * Delete a client
   */
  async deleteClient(clientId: string): Promise<ClientResult> {
    try {
      console.log("[UnifiedClientService] Deleting client:", clientId)

      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("[UnifiedClientService] Failed to delete client:", data.error)
        return { success: false, error: data.error || "Failed to delete client" }
      }

      if (data.success) {
        console.log("[UnifiedClientService] Client deleted successfully")

        // Remove from cache
        this.clientsCache = this.clientsCache.filter((c) => c.id !== clientId)

        return { success: true }
      } else {
        return { success: false, error: "Failed to delete client" }
      }
    } catch (error) {
      console.error("[UnifiedClientService] Error deleting client:", error)
      return { success: false, error: "Failed to delete client" }
    }
  }

  /**
   * Clear cached data
   */
  clearCache(): void {
    this.clientsCache = []
    this.lastFetchTime = null
  }

  /**
   * Refresh clients data
   */
  async refresh(): Promise<ClientResult> {
    this.clearCache()
    return await this.fetchClients()
  }
}

// Export singleton instance
export const clientService = new UnifiedClientService()

// Export class for testing
export { UnifiedClientService }
