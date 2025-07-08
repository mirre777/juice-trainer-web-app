import { type NextRequest, NextResponse } from "next/server"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase/firebase"
import { getUserByEmail, updateUser, storeInvitationCode } from "@/lib/firebase/user-service"
import { generateToken } from "@/lib/auth/token-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, invitationCode } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    console.log(`[API:login] 📧 Attempting login for email: ${email}`)

    // Firebase authentication
    let userCredential
    try {
      userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log(`[API:login] ✅ Firebase authentication successful`)
    } catch (authError: any) {
      console.error(`[API:login] ❌ Firebase auth error:`, authError)

      if (authError.code === "auth/user-not-found") {
        return NextResponse.json({ error: "No account found with this email" }, { status: 404 })
      }
      if (authError.code === "auth/wrong-password") {
        return NextResponse.json({ error: "Incorrect password" }, { status: 401 })
      }
      if (authError.code === "auth/invalid-email") {
        return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
      }

      return NextResponse.json({ error: "Authentication failed", details: authError.message }, { status: 500 })
    }

    // Get user data from Firestore - THIS IS WHERE THE ERROR WAS OCCURRING
    let userData
    try {
      userData = await getUserByEmail(email)
      if (!userData) {
        console.log(`[API:login] ❌ User data not found in Firestore`)
        return NextResponse.json({ error: "User profile not found" }, { status: 404 })
      }
    } catch (firestoreError: any) {
      console.error(`[API:login] 💥 Firestore error:`, firestoreError)
      return NextResponse.json(
        {
          error: "Database error",
          details: firestoreError.message,
        },
        { status: 500 },
      )
    }

    // Handle invitation code if provided
    if (invitationCode) {
      try {
        await storeInvitationCode(userCredential.user.uid, invitationCode)
        console.log(`[API:login] 💌 Invitation code stored`)
      } catch (inviteError: any) {
        console.error(`[API:login] ❌ Error storing invitation code:`, inviteError)
        // Don't fail login for invitation code errors
      }
    }

    // Update last login time
    try {
      await updateUser(userCredential.user.uid, {
        lastLoginAt: new Date().toISOString(),
      })
    } catch (updateError: any) {
      console.error(`[API:login] ❌ Error updating last login:`, updateError)
      // Don't fail login for update errors
    }

    // Generate JWT token
    let token
    try {
      token = await generateToken({
        uid: userCredential.user.uid,
        email: userCredential.user.email!,
        role: userData.role || "user",
      })
    } catch (tokenError: any) {
      console.error(`[API:login] ❌ Error generating token:`, tokenError)
      return NextResponse.json({ error: "Token generation failed" }, { status: 500 })
    }

    const response = NextResponse.json({
      success: true,
      user: {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        role: userData.role || "user",
        name: userData.name || userData.displayName,
      },
    })

    // Set cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    }

    response.cookies.set("auth-token", token, cookieOptions)
    response.cookies.set("auth_token", token, cookieOptions)
    response.cookies.set("user_id", userCredential.user.uid, cookieOptions)

    console.log(`[API:login] ✅ Login successful for ${email}`)
    return response
  } catch (error: any) {
    console.error("💥 Unexpected login error:", error)

    return NextResponse.json(
      {
        error: "Authentication failed",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
