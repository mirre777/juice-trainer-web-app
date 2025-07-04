"use client"

import { useState, useEffect } from "react"
import { authService, type AuthState, type User } from "@/lib/services/unified-auth-service"

export function useUnifiedAuth() {
  const [authState, setAuthState] = useState<AuthState>(() => authService.getState())

  useEffect(() => {
    console.log("[useUnifiedAuth] Setting up auth subscription")

    const unsubscribe = authService.subscribe((state) => {
      console.log("[useUnifiedAuth] Auth state updated:", {
        hasUser: !!state.user,
        loading: state.loading,
        error: state.error,
      })
      setAuthState(state)
    })

    return () => {
      console.log("[useUnifiedAuth] Cleaning up auth subscription")
      unsubscribe()
    }
  }, [])

  const refreshUser = async () => {
    console.log("[useUnifiedAuth] Refreshing user...")
    return await authService.refreshUser()
  }

  const logout = async () => {
    console.log("[useUnifiedAuth] Logging out...")
    const success = await authService.logout()
    if (success && typeof window !== "undefined") {
      window.location.href = "/login"
    }
    return success
  }

  const isAuthenticated = async () => {
    return await authService.isAuthenticated()
  }

  const getUserRole = async () => {
    return await authService.getUserRole()
  }

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    refreshUser,
    logout,
    isAuthenticated,
    getUserRole,
  }
}

// Convenience hook for just getting the current user
export function useCurrentUser(): { user: User | null; loading: boolean } {
  const { user, loading } = useUnifiedAuth()
  return { user, loading }
}

// Convenience hook for authentication status
export function useAuthStatus(): { isAuthenticated: boolean; loading: boolean } {
  const { user, loading } = useUnifiedAuth()
  return { isAuthenticated: !!user, loading }
}
