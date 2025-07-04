import { UnifiedAuthService } from "../services/unified-auth-service"

/**
 * @deprecated Use UnifiedAuthService instead
 * Legacy auth service for backward compatibility
 */
export class AuthService {
  constructor() {
    console.warn("⚠️ AuthService is deprecated. Please use UnifiedAuthService instead.")
  }

  async signIn(email: string, password: string, invitationCode?: string) {
    return await UnifiedAuthService.signIn(email, password, invitationCode)
  }

  async signOut() {
    return await UnifiedAuthService.signOut()
  }

  async getCurrentUser() {
    return await UnifiedAuthService.getCurrentUser()
  }

  async isAuthenticated() {
    return await UnifiedAuthService.isAuthenticated()
  }

  getUserIdFromCookies() {
    return UnifiedAuthService.getUserIdFromCookies()
  }
}

// Export singleton for backward compatibility
export const authService = new AuthService()

// Re-export UnifiedAuthService functions
export const signIn = UnifiedAuthService.signIn.bind(UnifiedAuthService)
export const signOut = UnifiedAuthService.signOut.bind(UnifiedAuthService)
export const getCurrentUser = UnifiedAuthService.getCurrentUser.bind(UnifiedAuthService)
export const isAuthenticated = UnifiedAuthService.isAuthenticated.bind(UnifiedAuthService)
