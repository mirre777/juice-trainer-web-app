"use client"

import { useState, useEffect } from "react"
import { loginWithGoogle, logoutUser } from "@/lib/services/auth-service"
import { ErrorType, handleClientError } from "@/lib/utils/error-handler"

interface AuthState {
  accessToken: string | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
}

export function useGoogleAuth() {
  const [authState, setAuthState] = useState<AuthState>({
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
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }))

      const response = await fetch("/api/auth/google/refresh")

      if (!response.ok) {
        // If unauthorized or other error, user is not authenticated
        setAuthState({
          accessToken: null,
          isLoading: false,
          error: null, // Don't show error for normal auth state
          isAuthenticated: false,
        })
        return
      }

      const data = await response.json()

      setAuthState({
        accessToken: data.access_token,
        isLoading: false,
        error: null,
        isAuthenticated: true,
      })
    } catch (err) {
      const appError = handleClientError(err, {
        component: "useGoogleAuth",
        operation: "checkAuthStatus",
        message: "Failed to check authentication status",
        errorType: ErrorType.AUTH_ERROR,
      })

      console.error("Auth check error:", appError)

      setAuthState({
        accessToken: null,
        isLoading: false,
        error: appError.message,
        isAuthenticated: false,
      })
    }
  }

  // Login with Google
  const login = () => {
    try {
      loginWithGoogle()
    } catch (err) {
      const appError = handleClientError(err, {
        component: "useGoogleAuth",
        operation: "login",
        message: "Failed to login",
        errorType: ErrorType.AUTH_ERROR,
      })

      console.error("Login error:", appError)
      throw appError
    }
  }

  // Logout
  const logout = () => {
    try {
      logoutUser()
    } catch (err) {
      const appError = handleClientError(err, {
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
    ...authState,
    login,
    logout,
    refreshToken: checkAuthStatus,
  }
}
