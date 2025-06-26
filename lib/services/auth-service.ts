/**
 * Authentication service
 *
 * This file contains functions for handling authentication-related API calls.
 * It's a wrapper around the actual API calls to provide a cleaner interface.
 */

import { storeTokens } from "@/lib/auth/token-service"
import { AppError, ErrorType, handleClientError, tryCatch } from "@/lib/utils/error-handler"

export async function loginWithGoogle() {
  return tryCatch(
    () => {
      // Redirect to Google OAuth endpoint
      window.location.href = "/api/auth/google/simple"
    },
    (error) => {
      throw handleClientError(error, {
        component: "AuthService",
        operation: "loginWithGoogle",
        message: "Failed to initiate Google login",
        errorType: ErrorType.AUTH_ERROR,
      })
    },
  )
}

export async function logoutUser() {
  return tryCatch(
    () => {
      // Redirect to logout endpoint
      window.location.href = "/api/auth/google/logout"
    },
    (error) => {
      throw handleClientError(error, {
        component: "AuthService",
        operation: "logoutUser",
        message: "Failed to logout user",
        errorType: ErrorType.AUTH_ERROR,
      })
    },
  )
}

export async function exchangeCodeForTokens(code: string) {
  return tryCatch(
    async () => {
      if (!code) {
        throw new AppError({
          message: "Authorization code is required",
          errorType: ErrorType.VALIDATION_ERROR,
        })
      }

      const response = await fetch("/api/auth/google/callback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      })

      if (!response.ok) {
        throw new AppError({
          message: "Failed to exchange code for tokens",
          errorType: ErrorType.AUTH_ERROR,
          statusCode: response.status,
        })
      }

      const tokenData = await response.json()
      await storeTokens(tokenData)

      return { success: true }
    },
    (error) => {
      const appError = handleClientError(error, {
        component: "AuthService",
        operation: "exchangeCodeForTokens",
        message: "Failed to exchange code for tokens",
        errorType: ErrorType.AUTH_ERROR,
      })

      console.error("Error exchanging code for tokens:", appError)
      return { success: false, error: appError }
    },
  )
}
