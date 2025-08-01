import { cookies } from "next/headers"
import { encrypt, decrypt } from "@/lib/utils/crypto"
import { ErrorType, handleServerError, tryCatch } from "@/lib/utils/error-handler"
import { OAuth2Client } from "google-auth-library"
import jwt from "jsonwebtoken"

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
const GOOGLE_TOKEN_COOKIE = "google_token"

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface TokenPayload {
  uid: string
  email: string
  role: string
}

// Generate JWT token
export const generateToken = async (payload: TokenPayload): Promise<string> => {
  const secret = process.env.JWT_SECRET || "fallback-secret-key"

  return jwt.sign(
    {
      uid: payload.uid,
      email: payload.email,
      role: payload.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    },
    secret,
  )
}

// Store tokens securely in cookies
export async function storeTokens(tokenData: TokenData): Promise<void> {
  return tryCatch(
    async () => {
      const cookieStore = await cookies()

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

      // Store Google token securely in a cookie
      const googleTokenData = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expiry_date: tokenData.expires_at,
        token_type: tokenData.token_type,
        scope: tokenData.scope,
      }

      cookieStore.set({
        name: GOOGLE_TOKEN_COOKIE,
        value: await encrypt(JSON.stringify(googleTokenData)),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
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
      const cookieStore = await cookies()

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
    async () => {
      const cookieStore = await cookies()

      cookieStore.delete(ACCESS_TOKEN_COOKIE)
      cookieStore.delete(REFRESH_TOKEN_COOKIE)
      cookieStore.delete(TOKEN_EXPIRY_COOKIE)
      cookieStore.delete(TOKEN_SCOPE_COOKIE)
      cookieStore.delete(GOOGLE_TOKEN_COOKIE)
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
const isTokenExpiredHelper = (tokenData: any) => {
  if (!tokenData || !tokenData.expiry_date) {
    return true
  }
  return Date.now() >= tokenData.expiry_date
}

export function isTokenExpired(tokenData: TokenData): boolean {
  // Add a 5-minute buffer to handle clock skew
  const bufferTime = 5 * 60 * 1000 // 5 minutes in milliseconds
  return Date.now() >= tokenData.expires_at - bufferTime
}

// Get token from server (for server components)
export async function getTokenFromServer(): Promise<OAuth2Client | null> {
  try {
    const cookieStore = await cookies()
    const encryptedToken = cookieStore.get(GOOGLE_TOKEN_COOKIE)?.value

    if (!encryptedToken) {
      console.log("No encrypted Google token found in cookies.")
      return null
    }

    const tokenData = JSON.parse(await decrypt(encryptedToken))

    if (!tokenData) {
      console.error("Failed to decrypt token data.")
      return null
    }

    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXT_PUBLIC_APP_URL + "/api/auth/google/callback",
    )

    oauth2Client.setCredentials(tokenData)

    // Check if the token is expired and refresh if necessary
    if (isTokenExpiredHelper(tokenData)) {
      console.log("Google token expired, attempting to refresh...")
      const { credentials } = await oauth2Client.refreshAccessToken()
      oauth2Client.setCredentials(credentials)

      // Update the cookie with the new token
      const newEncryptedToken = await encrypt(JSON.stringify(credentials)) // Re-encrypt the new token
      cookieStore.set(GOOGLE_TOKEN_COOKIE, newEncryptedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
      })
      console.log("Google token refreshed and cookie updated.")
    }

    return oauth2Client
  } catch (error) {
    console.error("Error in getTokenFromServer:", error)
    return null
  }
}

// JWT Token Service
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const secret = process.env.JWT_SECRET || "fallback-secret-key"
    const decoded = jwt.verify(token, secret) as any

    return {
      uid: decoded.uid,
      email: decoded.email,
      role: decoded.role,
    }
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}
