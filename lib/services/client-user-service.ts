/**
 * Client User Service
 * Handles user operations specifically for client-side components
 * This service acts as a bridge between client components and the unified services
 */

import { UnifiedAuthService } from "./unified-auth-service"
import { UnifiedClientService } from "./unified-client-service"
import type { User } from "firebase/auth"
import type { Client } from "@/types/client"

export class ClientUserService {
  private static instance: ClientUserService
  private authService: UnifiedAuthService
  private clientService: UnifiedClientService

  private constructor() {
    this.authService = UnifiedAuthService.getInstance()
    this.clientService = UnifiedClientService.getInstance()
  }

  public static getInstance(): ClientUserService {
    if (!ClientUserService.instance) {
      ClientUserService.instance = new ClientUserService()
    }
    return ClientUserService.instance
  }

  /**
   * Get current user with client-side optimizations
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      return await this.authService.getCurrentUser()
    } catch (error) {
      console.error("ClientUserService: Error getting current user:", error)
      return null
    }
  }

  /**
   * Get user's clients with caching
   */
  async getUserClients(userId: string): Promise<Client[]> {
    try {
      return await this.clientService.getClients(userId)
    } catch (error) {
      console.error("ClientUserService: Error getting user clients:", error)
      return []
    }
  }

  /**
   * Subscribe to user authentication state changes
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return this.authService.onAuthStateChanged(callback)
  }

  /**
   * Subscribe to user's clients changes
   */
  subscribeToUserClients(userId: string, callback: (clients: Client[]) => void): () => void {
    return this.clientService.subscribeToClients(userId, callback)
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    try {
      await this.authService.signOut()
    } catch (error) {
      console.error("ClientUserService: Error signing out:", error)
      throw error
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authService.isAuthenticated()
  }

  /**
   * Get user role
   */
  async getUserRole(userId: string): Promise<string | null> {
    try {
      const userData = await this.authService.getUserData(userId)
      return userData?.role || null
    } catch (error) {
      console.error("ClientUserService: Error getting user role:", error)
      return null
    }
  }
}

// Export singleton instance
export const clientUserService = ClientUserService.getInstance()
