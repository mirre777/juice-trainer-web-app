"use client"

import { useState, useEffect } from "react"
import { UnifiedAuthService, type AuthUser } from "@/lib/services/unified-auth-service"
import { ErrorType, handleClientError } from "@/lib/utils/error-handler"

export function useCurrentUser() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check if we're in demo mode
        const pathname = window.location.pathname
        if (pathname.includes("/demo/")) {
          console.log("Demo mode detected, using demo user")
          setUser({
            uid: "demo-user-123",
            email: "demo@example.com",
            name: "Demo User",
            role: "trainer",
          })
          setLoading(false)
          return
        }

        // Use unified auth service to get current user
        const authResult = await UnifiedAuthService.getCurrentUser()

        if (authResult.success && authResult.user) {
          console.log("✅ Current user retrieved:", authResult.user.email)
          setUser(authResult.user)
        } else {
          console.log("❌ No authenticated user found")
          setUser(null)
          if (authResult.error) {
            setError(authResult.error)
          }
        }
      } catch (err) {
        const appError = handleClientError(err, {
          component: "useCurrentUser",
          operation: "getCurrentUser",
          message: "Failed to get current user",
          errorType: ErrorType.AUTH_ERROR,
        })

        console.error("Error getting current user:", appError)
        setError(appError)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getCurrentUser()
  }, [])

  return {
    user,
    userId: user?.uid || null, // Keep backward compatibility
    loading,
    error,
  }
}
