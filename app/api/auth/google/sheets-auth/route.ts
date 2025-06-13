export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { google } from "googleapis"
import { encrypt } from "@/lib/utils/crypto"
import { getAppUrl } from "@/lib/utils/url-utils"

export async function GET() {
  try {
    // Google OAuth2 configuration
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${getAppUrl()}/api/auth/google/sheets-callback`,
    )

    // Define the scopes we need for Google Sheets
    const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]

    // Generate a random state value for security
    const state = Math.random().toString(36).substring(2, 15)

    // Encrypt the state to verify it when the user returns
    const encryptedState = encrypt(state)

    // Generate the authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      state: encryptedState,
      prompt: "consent", // Force to get refresh token
    })

    // Return the URL to the client
    return NextResponse.json({ url: authUrl })
  } catch (error) {
    console.error("Error generating auth URL:", error)
    return NextResponse.json(
      { message: "Failed to generate authentication URL", error: String(error) },
      { status: 500 },
    )
  }
}
