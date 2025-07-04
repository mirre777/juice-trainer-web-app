import { UnifiedAuthService } from "@/lib/services/unified-auth-service"

/**
 * @deprecated Use UnifiedAuthService directly
 * Legacy auth service that redirects to UnifiedAuthService
 */
export class AuthService {
  static async getCurrentUser() {
    console.warn("⚠️ AuthService is deprecated. Use UnifiedAuthService instead.")
    return await UnifiedAuthService.getCurrentUser()
  }

  static async signIn(email: string, password: string) {
    console.warn("⚠️ AuthService is deprecated. Use UnifiedAuthService instead.")
    return await UnifiedAuthService.signIn(email, password)
  }

  static async signUp(email: string, password: string, name?: string) {
    console.warn("⚠️ AuthService is deprecated. Use UnifiedAuthService instead.")
    return await UnifiedAuthService.signUp(email, password, name)
  }

  static async signOut() {
    console.warn("⚠️ AuthService is deprecated. Use UnifiedAuthService instead.")
    return await UnifiedAuthService.signOut()
  }

  static onAuthStateChanged(callback: (user: any) => void) {
    console.warn("⚠️ AuthService is deprecated. Use UnifiedAuthService instead.")
    return UnifiedAuthService.onAuthStateChanged(callback)
  }
}

// Export for backward compatibility
export const authService = AuthService
