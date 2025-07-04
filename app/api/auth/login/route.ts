import { NextResponse } from "next/server"
import { UnifiedAuthService } from "@/lib/firebase/user-service"

export async function POST(request: Request) {
  try {
    const { email, password, invitationCode } = await request.json()

    console.log(`[API:login] 🚀 Processing login for ${email}`)
    console.log(`[API:login] 🎫 Invitation code received:`, invitationCode)
    console.log(`[API:login] 🎫 Invitation code type:`, typeof invitationCode)
    console.log(`[API:login] 🎫 Invitation code length:`, invitationCode?.length)

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Use unified auth service for sign in
    const authResult = await UnifiedAuthService.signIn(email, password, invitationCode)

    if (!authResult.success) {
      console.log(`[API:login] ❌ Login failed:`, authResult.error?.message)

      // Handle specific error types
      const errorMessage = authResult.error?.message || "Login failed"
      const statusCode = authResult.error?.errorType === "AUTH_INVALID_CREDENTIALS" ? 401 : 400

      return NextResponse.json(
        {
          error: errorMessage,
          suggestSignup: authResult.message?.includes("sign up"),
        },
        { status: statusCode },
      )
    }

    console.log(`[API:login] ✅ Login successful for user: ${authResult.user?.uid}`)

    // Return success response
    const response = {
      success: true,
      userId: authResult.user?.uid,
      message: authResult.message || "Login successful!",
      authMethod: "firebase",
      invitationProcessed: !!invitationCode,
      pendingApproval: !!invitationCode,
    }

    // Set cookies and return
    if (authResult.user?.uid) {
      const token = await authResult.user.getIdToken()

      response.cookies = {
        auth_token: {
          value: token,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 1 week
          path: "/",
        },
        user_id: {
          value: authResult.user.uid,
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 1 week
          path: "/",
        },
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[API:login] ❌ Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred. Please try again later." }, { status: 500 })
  }
}
