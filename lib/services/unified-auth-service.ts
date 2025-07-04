/**
 * Unified Authentication Service
 *
 * Single source of truth for all authentication operations across the app.
 * Uses cookie-based authentication consistently.
 */

export interface User {
  uid: string
  email: string
  name: string
  role?: string
  user_type?: string
  universalInviteCode?: string
  inviteCode?: string
}

export interface AuthResult {
  success: boolean
  user?: User
  error?: string
}

class UnifiedAuthService {
  private currentUser: User | null = null
  private isInitialized = false

  /**
   * Get current user - always uses API with cookies
   */
  async getCurrentUser(): Promise<AuthResult> {
    try {
      console.log("[UnifiedAuthService] Getting current user via API")

      const response = await fetch("/api/auth/me", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        console.log("[UnifiedAuthService] User not authenticated")
        this.currentUser = null
        return { success: false, error: "Not authenticated" }
      }

      const userData = await response.json()
      console.log("[UnifiedAuthService] User data received:", userData)

      this.currentUser = {
        uid: userData.uid,
        email: userData.email || "",
        name: userData.name || "",
        role: userData.role,
        user_type: userData.user_type,
        universalInviteCode: userData.universalInviteCode || "",
        inviteCode: userData.inviteCode || "",
      }

      this.isInitialized = true
      return { success: true, user: this.currentUser }
    } catch (error) {
      console.error("[UnifiedAuthService] Error getting current user:", error)
      this.currentUser = null
      return { success: false, error: "Failed to get user data" }
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const result = await this.getCurrentUser()
    return result.success
  }

  /**
   * Check if user has required role
   */
  async hasRole(requiredRole: string): Promise<boolean> {
    const result = await this.getCurrentUser()
    if (!result.success || !result.user) return false

    return result.user.role === requiredRole
  }

  /**
   * Get cached user (if available)
   */
  getCachedUser(): User | null {
    return this.currentUser
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string, invitationCode?: string): Promise<AuthResult> {
    try {
      console.log("[UnifiedAuthService] Logging in user:", email)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          invitationCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("[UnifiedAuthService] Login failed:", data.error)
        return { success: false, error: data.error || "Login failed" }
      }

      console.log("[UnifiedAuthService] Login successful")

      // Refresh user data after successful login
      return await this.getCurrentUser()
    } catch (error) {
      console.error("[UnifiedAuthService] Login error:", error)
      return { success: false, error: "Login failed" }
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("[UnifiedAuthService] Logging out user")

      const response = await fetch("/api/auth/logout", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        this.currentUser = null
        this.isInitialized = false
        console.log("[UnifiedAuthService] Logout successful")
        return { success: true }
      } else {
        console.error("[UnifiedAuthService] Logout failed:", response.statusText)
        return { success: false, error: "Logout failed" }
      }
    } catch (error) {
      console.error("[UnifiedAuthService] Logout error:", error)
      return { success: false, error: "Logout failed" }
    }
  }

  /**
   * Clear cached user data
   */
  clearCache(): void {
    this.currentUser = null
    this.isInitialized = false
  }
}

// Export singleton instance
export const authService = new UnifiedAuthService()

// Export class for testing
export { UnifiedAuthService }
