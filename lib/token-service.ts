import { cookies } from "next/headers"
import { v4 as uuidv4 } from "uuid"
import { encrypt, decrypt } from "./crypto"
import { getAccessTokenByRefreshToken } from "@/data/refresh-token"
import { getVerificationTokenByEmail } from "@/data/verification-token"
import { getPasswordResetTokenByEmail } from "@/data/password-reset-token"
import { db } from "@/lib/db"
import { generateVerificationToken, generatePasswordResetToken } from "@/lib/tokens"
import { AppError } from "@/lib/utils/error-handler"

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

export const newVerificationToken = async (email: string) => {
  try {
    const existingToken = await getVerificationTokenByEmail(email)

    if (existingToken) {
      await db.verificationToken.delete({
        where: { id: existingToken.id },
      })
    }

    const token = await generateVerificationToken(email)
    return token
  } catch (error: any) {
    throw new AppError("Failed to generate verification token", 500)
  }
}

export const newPasswordResetToken = async (email: string) => {
  try {
    const existingToken = await getPasswordResetTokenByEmail(email)

    if (existingToken) {
      await db.passwordResetToken.delete({
        where: { id: existingToken.id },
      })
    }

    const token = await generatePasswordResetToken(email)
    return token
  } catch (error: any) {
    throw new AppError("Failed to generate password reset token", 500)
  }
}

export const newRefreshToken = () => {
  const newRefreshToken = uuidv4()
  return newRefreshToken
}

export const newAccessToken = async (refreshToken: string) => {
  try {
    const existingRefreshToken = await getAccessTokenByRefreshToken(refreshToken)

    if (!existingRefreshToken) {
      throw new AppError("Refresh token not found", 404)
    }

    if (existingRefreshToken.expires < new Date()) {
      await db.refreshToken.delete({
        where: { id: existingRefreshToken.id },
      })
      throw new AppError("Refresh token expired", 400)
    }

    const newAccessToken = uuidv4()
    return newAccessToken
  } catch (error: any) {
    throw new AppError(error.message || "Failed to generate access token", error.statusCode || 500)
  }
}

export const setRefreshTokenCookie = (refreshToken: string) => {
  cookies().set("refreshToken", refreshToken, {
    httpOnly: true,
    path: "/api/auth",
    secure: true,
    sameSite: "strict",
  })
}

// Store tokens securely in cookies
export const storeTokens = async (tokenData: TokenData): Promise<void> => {
  try {
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
  } catch (error) {
    console.error("Error storing tokens:", error)
    throw new Error("Failed to store authentication tokens")
  }
}

// Get tokens from cookies
export const getTokens = async (): Promise<TokenData | null> => {
  try {
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
  } catch (error) {
    console.error("Error retrieving tokens:", error)
    return null
  }
}

// Clear tokens from cookies
export const clearTokens = (): void => {
  try {
    const cookieStore = cookies()

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
export const isTokenExpired = (tokenData: TokenData): boolean => {
  // Add a 5-minute buffer to handle clock skew
  const bufferTime = 5 * 60 * 1000 // 5 minutes in milliseconds
  return Date.now() >= tokenData.expires_at - bufferTime
}
