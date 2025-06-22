export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Make sure we're using the URL utilities correctly
import { NextResponse } from "next/server"
import { storeTokens } from "@/lib/token-service"
import { normalizeUrl, joinUrl } from "@/lib/url-utils"

// Google OAuth configuration
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

// Normalize the app URL to ensure no trailing slash
const APP_URL = normalizeUrl(process.env.NEXT_PUBLIC_APP_URL || "")

// Construct redirect URI properly to avoid double slashes
const REDIRECT_URI = joinUrl(APP_URL, "/api/auth/google/callback")

// Log the values for debugging
console.log("OAuth Callback Route - APP_URL:", APP_URL)
console.log("OAuth Callback Route - REDIRECT_URI:", REDIRECT_URI)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    // Base redirect URL
    const redirectBase = APP_URL

    // Handle errors
    if (error) {
      console.error("OAuth error:", error)
      return NextResponse.redirect(`${redirectBase}/demo/schedule?error=${encodeURIComponent(error)}`)
    }

    if (!code) {
      console.error("Missing authorization code")
      return NextResponse.redirect(`${redirectBase}/demo/schedule?error=missing_code`)
    }

    // For direct auth flow, we don't need to check state
    // Exchange code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error("Token exchange error:", errorData)
      return NextResponse.redirect(`${redirectBase}/demo/schedule?error=token_exchange`)
    }

    const tokenData = await tokenResponse.json()

    // Calculate token expiry time
    const expiresAt = Date.now() + tokenData.expires_in * 1000

    // Store tokens securely
    await storeTokens({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt,
      token_type: tokenData.token_type,
      scope: tokenData.scope,
    })

    // Create response with redirect
    const response = NextResponse.redirect(`${redirectBase}/demo/schedule?success=true`)

    return response
  } catch (error) {
    console.error("Error in callback route:", error)
    const redirectBase = normalizeUrl(process.env.NEXT_PUBLIC_APP_URL || "")
    return NextResponse.redirect(`${redirectBase}/demo/schedule?error=server_error`)
  }
}
