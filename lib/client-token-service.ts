"use client"

// Client-side token service
import { useState, useEffect } from "react"
import { ErrorType, handleClientError } from "@/lib/utils/error-handler"

interface TokenState {
  accessToken: string | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
}

export function useGoogleAuth() {
  const [tokenState, setTokenState] = useState<TokenState>({
    accessToken: null,
    isLoading: true,
    error: null,
    isAuthenticated: false,
  })

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  // Check if user is authenticated and get a valid token
  const checkAuthStatus = async () => {
    try {
      setTokenState((prev) => ({ ...prev, isLoading: true, error: null }))

      const response = await fetch("/api/auth/google/refresh")

      if (!response.ok) {
        // If unauthorized or other error, user is not authenticated
        setTokenState({
          accessToken: null,
          isLoading: false,
          error: null, // Don't show error for normal auth state
          isAuthenticated: false,
        })
        return
      }

      const data = await response.json()

      setTokenState({
        accessToken: data.access_token,
        isLoading: false,
        error: null,
        isAuthenticated: true,
      })
    } catch (error) {
      const appError = handleClientError(error, {
        component: "useGoogleAuth",
        operation: "checkAuthStatus",
        message: "Failed to check authentication status",
        errorType: ErrorType.AUTH_ERROR,
      })

      console.error("Auth check error:", appError)

      setTokenState({
        accessToken: null,
        isLoading: false,
        error: appError.message,
        isAuthenticated: false,
      })
    }
  }

  // Start OAuth flow
  const login = () => {
    try {
      // Direct redirect to the auth endpoint
      window.location.href = "/api/auth/google/simple"
    } catch (error) {
      const appError = handleClientError(error, {
        component: "useGoogleAuth",
        operation: "login",
        message: "Failed to initiate login",
        errorType: ErrorType.AUTH_ERROR,
      })

      console.error("Login error:", appError)
      throw appError
    }
  }

  // Logout
  const logout = () => {
    try {
      window.location.href = "/api/auth/google/logout"
    } catch (error) {
      const appError = handleClientError(error, {
        component: "useGoogleAuth",
        operation: "logout",
        message: "Failed to logout",
        errorType: ErrorType.AUTH_ERROR,
      })

      console.error("Logout error:", appError)
      throw appError
    }
  }

  return {
    ...tokenState,
    login,
    logout,
    refreshToken: checkAuthStatus,
  }
}
