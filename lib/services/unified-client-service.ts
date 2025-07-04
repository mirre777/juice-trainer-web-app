// Unified Client Service - Single source of truth for all client operations

import type { Client } from "@/types/client"
import { authService } from "./unified-auth-service"

export interface ClientsState {
  clients: Client[]
  loading: boolean
  error: string | null
}

class UnifiedClientService {
  private static instance: UnifiedClientService
  private clients: Client[] = []
  private loading = false
  private error: string | null = null
  private listeners: Set<(state: ClientsState) => void> = new Set()
  private cache: Map<string, { data: Client[]; timestamp: number }> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  private constructor() {}

  public static getInstance(): UnifiedClientService {
    if (!UnifiedClientService.instance) {
      UnifiedClientService.instance = new UnifiedClientService()
    }
    return UnifiedClientService.instance
  }

  // Fetch clients using unified auth
  public async fetchClients(forceRefresh = false): Promise<Client[]> {
    try {
      console.log("[UnifiedClientService] Fetching clients...")

      // Get current user from auth service
      const user = await authService.getCurrentUser()
      if (!user) {
        throw new Error("User not authenticated")
      }

      const cacheKey = `clients_${user.uid}`

      // Check cache first (unless force refresh)
      if (!forceRefresh && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)!
        const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION

        if (!isExpired) {
          console.log("[UnifiedClientService] Returning cached clients")
          this.setClients(cached.data)
          return cached.data
        }
      }

      this.setLoading(true)
      this.setError(null)

      const response = await fetch("/api/clients", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch clients: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const clients = data.clients || []

      console.log("[UnifiedClientService] Fetched", clients.length, "clients")

      // Update cache
      this.cache.set(cacheKey, {
        data: clients,
        timestamp: Date.now(),
      })

      this.setClients(clients)
      return clients
    } catch (error) {
      console.error("[UnifiedClientService] Error fetching clients:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch clients"
      this.setError(errorMessage)
      return []
    } finally {
      this.setLoading(false)
    }
  }

  // Add client
  public async addClient(
    clientData: Partial<Client>,
  ): Promise<{ success: boolean; clientId?: string; error?: string }> {
    try {
      console.log("[UnifiedClientService] Adding client:", clientData.name)

      const user = await authService.getCurrentUser()
      if (!user) {
        throw new Error("User not authenticated")
      }

      const response = await fetch("/api/clients", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clientData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to add client: ${response.status}`)
      }

      const result = await response.json()

      // Refresh clients after adding
      await this.fetchClients(true)

      console.log("[UnifiedClientService] Client added successfully:", result.clientId)
      return { success: true, clientId: result.clientId }
    } catch (error) {
      console.error("[UnifiedClientService] Error adding client:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to add client"
      return { success: false, error: errorMessage }
    }
  }

  // Update client
  public async updateClient(clientId: string, updates: Partial<Client>): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("[UnifiedClientService] Updating client:", clientId)

      const user = await authService.getCurrentUser()
      if (!user) {
        throw new Error("User not authenticated")
      }

      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to update client: ${response.status}`)
      }

      // Refresh clients after updating
      await this.fetchClients(true)

      console.log("[UnifiedClientService] Client updated successfully")
      return { success: true }
    } catch (error) {
      console.error("[UnifiedClientService] Error updating client:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to update client"
      return { success: false, error: errorMessage }
    }
  }

  // Delete client
  public async deleteClient(clientId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("[UnifiedClientService] Deleting client:", clientId)

      const user = await authService.getCurrentUser()
      if (!user) {
        throw new Error("User not authenticated")
      }

      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to delete client: ${response.status}`)
      }

      // Refresh clients after deleting
      await this.fetchClients(true)

      console.log("[UnifiedClientService] Client deleted successfully")
      return { success: true }
    } catch (error) {
      console.error("[UnifiedClientService] Error deleting client:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to delete client"
      return { success: false, error: errorMessage }
    }
  }

  // Get current clients (from local state)
  public getClients(): Client[] {
    return this.clients
  }

  // Clear cache
  public clearCache(): void {
    this.cache.clear()
    console.log("[UnifiedClientService] Cache cleared")
  }

  // State management
  private setClients(clients: Client[]): void {
    this.clients = clients
    this.notifyListeners()
  }

  private setLoading(loading: boolean): void {
    this.loading = loading
    this.notifyListeners()
  }

  private setError(error: string | null): void {
    this.error = error
    this.notifyListeners()
  }

  private notifyListeners(): void {
    const state: ClientsState = {
      clients: this.clients,
      loading: this.loading,
      error: this.error,
    }
    this.listeners.forEach((listener) => listener(state))
  }

  // Subscription methods for React components
  public subscribe(listener: (state: ClientsState) => void): () => void {
    this.listeners.add(listener)

    // Immediately call with current state
    listener({
      clients: this.clients,
      loading: this.loading,
      error: this.error,
    })

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  public getState(): ClientsState {
    return {
      clients: this.clients,
      loading: this.loading,
      error: this.error,
    }
  }
}

// Export singleton instance
export const clientService = UnifiedClientService.getInstance()

// Export default for easier importing
export default clientService
