import { sign, verify } from "jsonwebtoken"
import { cookies } from "next/headers"
import { encrypt, decrypt } from "@/lib/utils/crypto"
import { ErrorType, handleServerError, tryCatch } from "@/lib/utils/error-handler"

// Types for tokens
export interface TokenData {
  access_token: string
  refresh_token?: string
  expires_at: number // Timestamp when the token expires
  token_type: string
  scope: string
}

// Cookie names
const ACCESS_TOKEN_COOKIE = "google_access_token"
const REFRESH_TOKEN_COOKIE = "google_refresh_token"
const TOKEN_EXPIRY_COOKIE = "google_token_expiry"
const TOKEN_SCOPE_COOKIE = "google_token_scope"

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_key" // Replace with a strong, secret key in production

interface User {
  id: string
  email: string
  name: string
  role: string
}

// Generate JWT token
export const generateToken = (uid: string): string => {
  // Sign the token with the user ID
  const token = sign({ uid }, JWT_SECRET, {
    expiresIn: "7d", // Token expires in 7 days
  })

  return token
}

// Store tokens securely in cookies
export async function storeTokens(tokenData: TokenData): Promise<void> {
  return tryCatch(
    async () => {
      const cookieStore = cookies()

      // Set secure HTTP-only cookies with encryption
      cookieStore.set({
        name: ACCESS_TOKEN_COOKIE,
        value: await encrypt(tokenData.access_token),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
        sameSite: "lax",
      })

      if (tokenData.refresh_token) {
        cookieStore.set({
          name: REFRESH_TOKEN_COOKIE,
          value: await encrypt(tokenData.refresh_token),
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 365, // 1 year
          path: "/",
          sameSite: "lax",
        })
      }

      cookieStore.set({
        name: TOKEN_EXPIRY_COOKIE,
        value: tokenData.expires_at.toString(),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
        sameSite: "lax",
      })

      cookieStore.set({
        name: TOKEN_SCOPE_COOKIE,
        value: tokenData.scope,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
        sameSite: "lax",
      })
    },
    (error) => {
      throw handleServerError(error, {
        service: "TokenService",
        operation: "storeTokens",
        message: "Failed to store authentication tokens",
        errorType: ErrorType.AUTH_ERROR,
      })
    },
  )
}

// Get tokens from cookies
export async function getTokens(): Promise<TokenData | null> {
  return tryCatch(
    async () => {
      const cookieStore = cookies()

      const accessTokenCookie = cookieStore.get(ACCESS_TOKEN_COOKIE)
      const refreshTokenCookie = cookieStore.get(REFRESH_TOKEN_COOKIE)
      const expiryTokenCookie = cookieStore.get(TOKEN_EXPIRY_COOKIE)
      const scopeTokenCookie = cookieStore.get(TOKEN_SCOPE_COOKIE)

      if (!accessTokenCookie || !expiryTokenCookie || !scopeTokenCookie) {
        return null
      }

      return {
        access_token: await decrypt(accessTokenCookie.value),
        refresh_token: refreshTokenCookie ? await decrypt(refreshTokenCookie.value) : undefined,
        expires_at: Number.parseInt(expiryTokenCookie.value),
        token_type: "Bearer",
        scope: scopeTokenCookie.value,
      }
    },
    (error) => {
      // Don't throw here, just return null and log the error
      handleServerError(error, {
        service: "TokenService",
        operation: "getTokens",
        message: "Error retrieving tokens",
        errorType: ErrorType.AUTH_ERROR,
        logOnly: true,
      })
      return null
    },
  )
}

// Clear tokens from cookies
export function clearTokens(): void {
  return tryCatch(
    () => {
      const cookieStore = cookies()

      cookieStore.delete(ACCESS_TOKEN_COOKIE)
      cookieStore.delete(REFRESH_TOKEN_COOKIE)
      cookieStore.delete(TOKEN_EXPIRY_COOKIE)
      cookieStore.delete(TOKEN_SCOPE_COOKIE)
    },
    (error) => {
      throw handleServerError(error, {
        service: "TokenService",
        operation: "clearTokens",
        message: "Failed to clear authentication tokens",
        errorType: ErrorType.AUTH_ERROR,
      })
    },
  )
}

// Check if token is expired
export function isTokenExpired(tokenData: TokenData): boolean {
  // Add a 5-minute buffer to handle clock skew
  const bufferTime = 5 * 60 * 1000 // 5 minutes in milliseconds
  return Date.now() >= tokenData.expires_at - bufferTime
}

// Get token from server (for server components)
export async function getTokenFromServer(): Promise<TokenData | null> {
  return getTokens()
}

// JWT Token Service
export const verifyToken = async (token: string): Promise<{ uid: string; email: string; role: string } | null> => {
  return tryCatch(
    () => {
      return new Promise((resolve, reject) => {
        verify(token, JWT_SECRET, (err, decoded: any) => {
          if (err) {
            console.error("Token verification error:", err)
            return resolve(null)
          }

          if (!decoded || typeof decoded === "string") {
            return resolve(null)
          }

          resolve({ uid: decoded.uid, email: decoded.email, role: decoded.role })
        })
      })
    },
    (error) => {
      // Don't throw here, just return null and log the error
      handleServerError(error, {
        service: "TokenService",
        operation: "verifyToken",
        message: "Token verification failed",
        errorType: ErrorType.AUTH_ERROR,
        logOnly: true,
      })
      return null
    },
  )
}
