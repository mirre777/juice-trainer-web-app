import { UnifiedAuthService } from "../services/unified-auth-service"

/**
 * @deprecated Use UnifiedAuthService instead
 * This service is maintained for backward compatibility
 */
export class AuthService {
  private unifiedAuthService: UnifiedAuthService

  constructor() {
    this.unifiedAuthService = new UnifiedAuthService()
    console.warn("AuthService is deprecated. Use UnifiedAuthService directly.")
  }

  async login(email: string, password: string) {
    return this.unifiedAuthService.login(email, password)
  }

  async signup(email: string, password: string, userData: any) {
    return this.unifiedAuthService.signup(email, password, userData)
  }

  async logout() {
    return this.unifiedAuthService.logout()
  }

  async getCurrentUser() {
    return this.unifiedAuthService.getCurrentUser()
  }

  async refreshToken() {
    return this.unifiedAuthService.refreshToken()
  }

  onAuthStateChanged(callback: (user: any) => void) {
    return this.unifiedAuthService.onAuthStateChanged(callback)
  }
}

export const authService = new AuthService()
