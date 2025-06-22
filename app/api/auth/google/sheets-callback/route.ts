import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    console.error("Error during Google OAuth:", error)
    return NextResponse.redirect(new URL("/programs?error=auth_failed", request.url))
  }

  if (!code) {
    console.error("No code provided in callback")
    return NextResponse.redirect(new URL("/programs?error=no_code", request.url))
  }

  try {
    // Exchange the code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/sheets-callback`,
        grant_type: "authorization_code",
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error("Failed to exchange code for tokens:", errorData)
      return NextResponse.redirect(new URL("/programs?error=token_exchange", request.url))
    }

    const tokenData = await tokenResponse.json()

    // Store tokens in cookies
    const cookieStore = cookies()
    cookieStore.set("google_sheets_access_token", tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: tokenData.expires_in,
      path: "/",
    })

    if (tokenData.refresh_token) {
      cookieStore.set("google_sheets_refresh_token", tokenData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
      })
    }

    // Redirect back to the programs page with a success parameter
    return NextResponse.redirect(new URL("/programs?connected=true", request.url))
  } catch (error) {
    console.error("Error during token exchange:", error)
    return NextResponse.redirect(new URL("/programs?error=server_error", request.url))
  }
}
