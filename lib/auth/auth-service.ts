import { UnifiedAuthService } from "@/lib/services/unified-auth-service"

/**
 * @deprecated This service is deprecated. Use UnifiedAuthService instead.
 *
 * Legacy Auth Service - Redirects to UnifiedAuthService
 * This file is kept for backward compatibility during migration.
 * All functions now redirect to the new UnifiedAuthService.
 */

console.warn("⚠️ [DEPRECATED] lib/auth/auth-service.ts is deprecated. Please use UnifiedAuthService instead.")

export interface AuthUser {
  uid: string
  email: string
  name?: string
  role?: string
}

export interface AuthResult {
  success: boolean
  user?: AuthUser
  error?: any
  message?: string
}

/**
 * @deprecated Use UnifiedAuthService.signIn() instead
 */
export async function signIn(email: string, password: string, invitationCode?: string): Promise<AuthResult> {
  console.warn("⚠️ [DEPRECATED] signIn() is deprecated. Use UnifiedAuthService.signIn() instead.")

  try {
    const result = await UnifiedAuthService.signIn(email, password, invitationCode)
    return {
      success: result.success,
      user: result.user
        ? {
            uid: result.user.uid,
            email: result.user.email,
            name: result.user.name,
            role: result.user.role,
          }
        : undefined,
      error: result.error,
      message: result.message,
    }
  } catch (error) {
    console.error("[DEPRECATED:signIn] Error:", error)
    return {
      success: false,
      error: error,
      message: "Authentication failed",
    }
  }
}

/**
 * @deprecated Use UnifiedAuthService.signOut() instead
 */
export async function signOut(): Promise<AuthResult> {
  console.warn("⚠️ [DEPRECATED] signOut() is deprecated. Use UnifiedAuthService.signOut() instead.")

  try {
    const result = await UnifiedAuthService.signOut()
    return {
      success: result.success,
      error: result.error,
      message: result.message,
    }
  } catch (error) {
    console.error("[DEPRECATED:signOut] Error:", error)
    return {
      success: false,
      error: error,
      message: "Sign out failed",
    }
  }
}

/**
 * @deprecated Use UnifiedAuthService.getCurrentUser() instead
 */
export async function getCurrentUser(): Promise<AuthResult> {
  console.warn("⚠️ [DEPRECATED] getCurrentUser() is deprecated. Use UnifiedAuthService.getCurrentUser() instead.")

  try {
    const result = await UnifiedAuthService.getCurrentUser()
    return {
      success: result.success,
      user: result.user
        ? {
            uid: result.user.uid,
            email: result.user.email,
            name: result.user.name,
            role: result.user.role,
          }
        : undefined,
      error: result.error,
      message: result.message,
    }
  } catch (error) {
    console.error("[DEPRECATED:getCurrentUser] Error:", error)
    return {
      success: false,
      error: error,
      message: "Failed to get current user",
    }
  }
}

/**
 * @deprecated Use UnifiedAuthService.isAuthenticated() instead
 */
export async function isAuthenticated(): Promise<boolean> {
  console.warn("⚠️ [DEPRECATED] isAuthenticated() is deprecated. Use UnifiedAuthService.isAuthenticated() instead.")

  try {
    return await UnifiedAuthService.isAuthenticated()
  } catch (error) {
    console.error("[DEPRECATED:isAuthenticated] Error:", error)
    return false
  }
}

/**
 * @deprecated Use UnifiedAuthService.getUserIdFromCookies() instead
 */
export function getUserIdFromCookies(): string | null {
  console.warn(
    "⚠️ [DEPRECATED] getUserIdFromCookies() is deprecated. Use UnifiedAuthService.getUserIdFromCookies() instead.",
  )

  try {
    return UnifiedAuthService.getUserIdFromCookies()
  } catch (error) {
    console.error("[DEPRECATED:getUserIdFromCookies] Error:", error)
    return null
  }
}

// Export types for backward compatibility
export type { AuthUser, AuthResult }
