export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { getTokens, storeTokens, isTokenExpired } from "@/lib/token-service"

// Google OAuth configuration
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

export async function GET(request: NextRequest) {
  try {
    // Get current tokens
    const tokens = await getTokens()

    if (!tokens || !tokens.refresh_token) {
      return NextResponse.json({ error: "No refresh token available" }, { status: 401 })
    }

    // Check if token is expired
    if (!isTokenExpired(tokens)) {
      return NextResponse.json({
        access_token: tokens.access_token,
        expires_at: tokens.expires_at,
      })
    }

    // Refresh the token
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID!,
        client_secret: CLIENT_SECRET!,
        refresh_token: tokens.refresh_token,
        grant_type: "refresh_token",
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error("Token refresh error:", errorData)
      return NextResponse.json({ error: "Failed to refresh token" }, { status: 401 })
    }

    const tokenData = await tokenResponse.json()

    // Calculate token expiry time
    const expiresAt = Date.now() + tokenData.expires_in * 1000

    // Store the new tokens (keeping the existing refresh token if not provided)
    await storeTokens({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || tokens.refresh_token,
      expires_at: expiresAt,
      token_type: tokenData.token_type || "Bearer",
      scope: tokenData.scope || tokens.scope,
    })

    return NextResponse.json({
      access_token: tokenData.access_token,
      expires_at: expiresAt,
    })
  } catch (error) {
    console.error("Token refresh error:", error)
    return NextResponse.json({ error: "Server error during token refresh" }, { status: 500 })
  }
}
