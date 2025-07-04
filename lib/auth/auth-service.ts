import { UnifiedAuthService } from "../services/unified-auth-service"

// Legacy auth service - deprecated, use UnifiedAuthService instead
export class AuthService {
  private unifiedService = new UnifiedAuthService()

  constructor() {
    console.warn("AuthService is deprecated. Please use UnifiedAuthService instead.")
  }

  async login(email: string, password: string) {
    console.warn("AuthService.login is deprecated. Use UnifiedAuthService.signIn instead.")
    return this.unifiedService.signIn(email, password)
  }

  async signup(email: string, password: string, userData?: any) {
    console.warn("AuthService.signup is deprecated. Use UnifiedAuthService.signUp instead.")
    return this.unifiedService.signUp(email, password, userData)
  }

  async logout() {
    console.warn("AuthService.logout is deprecated. Use UnifiedAuthService.signOut instead.")
    return this.unifiedService.signOut()
  }

  async getCurrentUser() {
    console.warn("AuthService.getCurrentUser is deprecated. Use UnifiedAuthService.getCurrentUser instead.")
    return this.unifiedService.getCurrentUser()
  }

  onAuthStateChanged(callback: (user: any) => void) {
    console.warn("AuthService.onAuthStateChanged is deprecated. Use UnifiedAuthService.onAuthStateChanged instead.")
    return this.unifiedService.onAuthStateChanged(callback)
  }
}

// Export singleton instance for backward compatibility
export const authService = new AuthService()
