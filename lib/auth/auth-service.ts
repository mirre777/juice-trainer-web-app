/**
 * Legacy Auth Service (DEPRECATED)
 *
 * This service is deprecated and will be removed in a future version.
 * Please use UnifiedAuthService instead.
 *
 * This file now acts as a wrapper around UnifiedAuthService to maintain
 * backward compatibility during the migration period.
 */

import { UnifiedAuthService } from "../services/unified-auth-service"
import type { User } from "firebase/auth"

/**
 * @deprecated Use UnifiedAuthService instead
 */
export class AuthService {
  private unifiedAuthService: UnifiedAuthService

  constructor() {
    console.warn("⚠️  AuthService is deprecated. Please use UnifiedAuthService instead.")
    this.unifiedAuthService = UnifiedAuthService.getInstance()
  }

  /**
   * @deprecated Use UnifiedAuthService.signIn instead
   */
  async signIn(email: string, password: string): Promise<User | null> {
    console.warn("⚠️  AuthService.signIn is deprecated. Use UnifiedAuthService.signIn instead.")
    return this.unifiedAuthService.signIn(email, password)
  }

  /**
   * @deprecated Use UnifiedAuthService.signUp instead
   */
  async signUp(email: string, password: string, userData?: any): Promise<User | null> {
    console.warn("⚠️  AuthService.signUp is deprecated. Use UnifiedAuthService.signUp instead.")
    return this.unifiedAuthService.signUp(email, password, userData)
  }

  /**
   * @deprecated Use UnifiedAuthService.signOut instead
   */
  async signOut(): Promise<void> {
    console.warn("⚠️  AuthService.signOut is deprecated. Use UnifiedAuthService.signOut instead.")
    return this.unifiedAuthService.signOut()
  }

  /**
   * @deprecated Use UnifiedAuthService.getCurrentUser instead
   */
  async getCurrentUser(): Promise<User | null> {
    console.warn("⚠️  AuthService.getCurrentUser is deprecated. Use UnifiedAuthService.getCurrentUser instead.")
    return this.unifiedAuthService.getCurrentUser()
  }

  /**
   * @deprecated Use UnifiedAuthService.onAuthStateChanged instead
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    console.warn("⚠️  AuthService.onAuthStateChanged is deprecated. Use UnifiedAuthService.onAuthStateChanged instead.")
    return this.unifiedAuthService.onAuthStateChanged(callback)
  }

  /**
   * @deprecated Use UnifiedAuthService.isAuthenticated instead
   */
  isAuthenticated(): boolean {
    console.warn("⚠️  AuthService.isAuthenticated is deprecated. Use UnifiedAuthService.isAuthenticated instead.")
    return this.unifiedAuthService.isAuthenticated()
  }

  /**
   * @deprecated Use UnifiedAuthService.getUserData instead
   */
  async getUserData(userId: string): Promise<any> {
    console.warn("⚠️  AuthService.getUserData is deprecated. Use UnifiedAuthService.getUserData instead.")
    return this.unifiedAuthService.getUserData(userId)
  }
}

// Export singleton instance for backward compatibility
export const authService = new AuthService()
