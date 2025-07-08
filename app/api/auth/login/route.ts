import { type NextRequest, NextResponse } from "next/server"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase/firebase"
import { getUserByEmail } from "@/lib/firebase/user-service"
import { generateToken } from "@/lib/auth/token-service"

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Login attempt started")

    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    console.log(`📧 Attempting login for email: ${email}`)

    // Firebase authentication
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    console.log(`✅ Firebase authentication successful for: ${userCredential.user.uid}`)

    // Get user data from Firestore
    const userData = await getUserByEmail(email)
    if (!userData) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Generate JWT token
    const token = await generateToken({
      uid: userCredential.user.uid,
      email: userCredential.user.email!,
      role: userData.role || "user",
    })

    console.log("🎉 Login successful, setting cookies")

    const response = NextResponse.json({
      success: true,
      user: {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        role: userData.role || "user",
      },
    })

    // Set multiple cookie formats for compatibility
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    }

    // Set both cookie names for compatibility
    response.cookies.set("auth-token", token, cookieOptions)
    response.cookies.set("auth_token", token, cookieOptions)
    response.cookies.set("user_id", userCredential.user.uid, cookieOptions)

    return response
  } catch (error: any) {
    console.error("💥 Login error:", error)

    if (error.code === "auth/user-not-found") {
      return NextResponse.json({ error: "No account found with this email" }, { status: 404 })
    }
    if (error.code === "auth/wrong-password") {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 })
    }

    return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
  }
}
