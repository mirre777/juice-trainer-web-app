/**
 * Authentication service
 *
 * This file contains functions for handling authentication-related API calls.
 * It's a wrapper around the actual API calls to provide a cleaner interface.
 */

import { storeTokens } from "@/lib/auth/token-service"
import { AppError, createError, ErrorType, handleClientError, tryCatch } from "@/lib/utils/error-handler"

export async function loginWithGoogle() {
  return tryCatch(
    async () => {
      // Redirect to Google OAuth endpoint
      window.location.href = "/api/auth/google/simple"
    },
    (error) => {
      throw handleClientError(error, {
        component: "AuthService",
        operation: "loginWithGoogle",
        message: "Failed to initiate Google login",
        errorType: ErrorType.AUTH_PROVIDER_ERROR,
      })
    },
  )
}

export async function logoutUser() {
  return tryCatch(
    async () => {
      // Redirect to logout endpoint
      window.location.href = "/api/auth/google/logout"
    },
    (error) => {
      throw handleClientError(error, {
        component: "AuthService",
        operation: "logoutUser",
        message: "Failed to logout user",
        errorType: ErrorType.AUTH_PROVIDER_ERROR,
      })
    },
  )
}

export async function exchangeCodeForTokens(code: string) {
  return tryCatch(
    async () => {
      if (!code) {
        throw createError(ErrorType.INVALID_INPUT, null, null, "Authorization code is required")
      }

      const response = await fetch("/api/auth/google/callback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      })

      if (!response.ok) {
        throw createError(ErrorType.AUTH_PROVIDER_ERROR, null, null, "Failed to exchange code for tokens")
      }

      const tokenData = await response.json()
      await storeTokens(tokenData)

      return { success: true }
    },
    (error: ErrorType) => {
      return handleClientError(error, {
        component: "AuthService",
        operation: "exchangeCodeForTokens",
        message: "Failed to exchange code for tokens",
        errorType: ErrorType.AUTH_PROVIDER_ERROR,
      })
    },
  )
}
