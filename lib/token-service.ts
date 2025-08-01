// Token service for managing Google OAuth tokens
import { cookies } from "next/headers"
import { encrypt, decrypt } from "./crypto"

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

// Store tokens securely in cookies
export async function storeTokens(tokenData: TokenData): Promise<void> {
  try {
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
  } catch (error) {
    console.error("Error storing tokens:", error)
    throw new Error("Failed to store authentication tokens")
  }
}

// Get tokens from cookies
export async function getTokens(): Promise<TokenData | null> {
  try {
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
  } catch (error) {
    console.error("Error retrieving tokens:", error)
    return null
  }
}

// Clear tokens from cookies
export async function clearTokens(): Promise<void> {
  try {
    const cookieStore = await cookies()

    cookieStore.delete(ACCESS_TOKEN_COOKIE)
    cookieStore.delete(REFRESH_TOKEN_COOKIE)
    cookieStore.delete(TOKEN_EXPIRY_COOKIE)
    cookieStore.delete(TOKEN_SCOPE_COOKIE)
  } catch (error) {
    console.error("Error clearing tokens:", error)
    throw new Error("Failed to clear authentication tokens")
  }
}

// Check if token is expired
export function isTokenExpired(tokenData: TokenData): boolean {
  // Add a 5-minute buffer to handle clock skew
  const bufferTime = 5 * 60 * 1000 // 5 minutes in milliseconds
  return Date.now() >= tokenData.expires_at - bufferTime
}
