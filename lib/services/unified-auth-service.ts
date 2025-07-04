// Unified Authentication Service - Single source of truth for all auth operations

export interface User {
  uid: string
  email: string
  name: string
  role?: string
  user_type?: string
  universalInviteCode?: string
  inviteCode?: string
}

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

class UnifiedAuthService {
  private static instance: UnifiedAuthService
  private currentUser: User | null = null
  private loading = true
  private error: string | null = null
  private listeners: Set<(state: AuthState) => void> = new Set()

  private constructor() {
    // Initialize auth state on creation
    this.initializeAuth()
  }

  public static getInstance(): UnifiedAuthService {
    if (!UnifiedAuthService.instance) {
      UnifiedAuthService.instance = new UnifiedAuthService()
    }
    return UnifiedAuthService.instance
  }

  // Initialize authentication state
  private async initializeAuth(): Promise<void> {
    try {
      console.log("[UnifiedAuthService] Initializing auth state...")
      this.setLoading(true)

      const user = await this.fetchCurrentUser()
      this.setUser(user)
      this.setError(null)
    } catch (error) {
      console.error("[UnifiedAuthService] Failed to initialize auth:", error)
      this.setError("Failed to initialize authentication")
      this.setUser(null)
    } finally {
      this.setLoading(false)
    }
  }

  // Fetch current user from API (single source of truth)
  private async fetchCurrentUser(): Promise<User | null> {
    try {
      console.log("[UnifiedAuthService] Fetching current user from API...")

      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.status === 401) {
        console.log("[UnifiedAuthService] User not authenticated")
        return null
      }

      if (!response.ok) {
        console.error("[UnifiedAuthService] API error:", response.status, response.statusText)
        throw new Error(`Authentication API error: ${response.status}`)
      }

      const userData = await response.json()
      console.log("[UnifiedAuthService] User authenticated:", {
        uid: userData.uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
      })

      return userData
    } catch (error) {
      console.error("[UnifiedAuthService] Error fetching current user:", error)
      throw error
    }
  }

  // Public methods
  public async getCurrentUser(): Promise<User | null> {
    if (this.loading) {
      // Wait for initialization to complete
      await new Promise((resolve) => {
        const checkLoading = () => {
          if (!this.loading) {
            resolve(void 0)
          } else {
            setTimeout(checkLoading, 50)
          }
        }
        checkLoading()
      })
    }
    return this.currentUser
  }

  public async refreshUser(): Promise<User | null> {
    try {
      this.setLoading(true)
      const user = await this.fetchCurrentUser()
      this.setUser(user)
      this.setError(null)
      return user
    } catch (error) {
      console.error("[UnifiedAuthService] Error refreshing user:", error)
      this.setError("Failed to refresh user")
      return null
    } finally {
      this.setLoading(false)
    }
  }

  public async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser()
    return user !== null
  }

  public async getUserRole(): Promise<string | null> {
    const user = await this.getCurrentUser()
    return user?.role || null
  }

  public async logout(): Promise<boolean> {
    try {
      console.log("[UnifiedAuthService] Logging out...")

      const response = await fetch("/api/auth/logout", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        // Clear local state
        this.setUser(null)
        this.setError(null)

        // Clear browser storage
        if (typeof window !== "undefined") {
          localStorage.clear()
          sessionStorage.clear()
        }

        console.log("[UnifiedAuthService] Logout successful")
        return true
      } else {
        console.error("[UnifiedAuthService] Logout failed:", response.statusText)
        return false
      }
    } catch (error) {
      console.error("[UnifiedAuthService] Logout error:", error)
      return false
    }
  }

  // State management
  private setUser(user: User | null): void {
    this.currentUser = user
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
    const state: AuthState = {
      user: this.currentUser,
      loading: this.loading,
      error: this.error,
    }
    this.listeners.forEach((listener) => listener(state))
  }

  // Subscription methods for React components
  public subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener)

    // Immediately call with current state
    listener({
      user: this.currentUser,
      loading: this.loading,
      error: this.error,
    })

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  public getState(): AuthState {
    return {
      user: this.currentUser,
      loading: this.loading,
      error: this.error,
    }
  }
}

// Export singleton instance
export const authService = UnifiedAuthService.getInstance()

// Export default for easier importing
export default authService
