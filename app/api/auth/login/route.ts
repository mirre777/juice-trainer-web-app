import { type NextRequest, NextResponse } from "next/server"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase/firebase"
import { getUserByEmail, updateUser, storeInvitationCode } from "@/lib/firebase/user-service"
import { processLoginInvitation } from "@/lib/firebase/client-service"

export async function POST(request: NextRequest) {
  try {
    console.log("[LOGIN] Starting login process")

    const body = await request.json()
    const { email, password, invitationCode } = body

    console.log("[LOGIN] Login attempt:", {
      email,
      hasPassword: !!password,
      hasInvitationCode: !!invitationCode,
    })

    if (!email || !password) {
      console.log("[LOGIN] Missing email or password")
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Authenticate with Firebase Auth
    console.log("[LOGIN] Authenticating with Firebase Auth...")
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user

    console.log("[LOGIN] Firebase Auth successful:", {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
    })

    // Get user data from Firestore
    console.log("[LOGIN] Getting user data from Firestore...")
    let userData = null
    try {
      userData = await getUserByEmail(email)
    } catch (firestoreError) {
      console.error("[LOGIN] Error getting user from Firestore:", firestoreError)
      // Continue with Firebase Auth data if Firestore fails
    }

    if (!userData) {
      console.log("[LOGIN] No user data found in Firestore, using Firebase Auth data")
      userData = {
        id: firebaseUser.uid,
        email: firebaseUser.email || email,
        name: firebaseUser.displayName || "",
        role: "user" as const,
        isApproved: true,
      }
    }

    console.log("[LOGIN] User data retrieved:", {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      isApproved: userData.isApproved,
    })

    // Process invitation code if provided
    if (invitationCode) {
      console.log("[LOGIN] Processing invitation code:", invitationCode)
      try {
        // Store invitation code
        await storeInvitationCode(userData.id, invitationCode)
        console.log("[LOGIN] Invitation code stored successfully")

        // Process login invitation
        const invitationResult = await processLoginInvitation(invitationCode, userData.id)
        if (invitationResult.success) {
          console.log("[LOGIN] Invitation processed successfully")

          // Update user status
          await updateUser(userData.id, {
            status: "pending_approval",
            invitationCode: invitationCode,
          })

          userData.status = "pending_approval"
          userData.invitationCode = invitationCode
        } else {
          console.log("[LOGIN] Invitation processing failed:", invitationResult.error)
        }
      } catch (invitationError) {
        console.error("[LOGIN] Error processing invitation:", invitationError)
        // Continue with login even if invitation processing fails
      }
    }

    // Get Firebase ID token for authentication
    const token = await firebaseUser.getIdToken()

    console.log("[LOGIN] Login successful for user:", userData.id)

    const response = NextResponse.json({
      success: true,
      user: userData,
      message: invitationCode ? "Login successful. Your account is pending approval." : "Login successful",
    })

    // Set authentication cookies
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    response.cookies.set("user_id", userData.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return response
  } catch (error: any) {
    console.error("[LOGIN] Login error:", error)

    // Handle specific Firebase Auth errors
    if (error.code === "auth/user-not-found") {
      return NextResponse.json({ error: "No account found with this email address" }, { status: 401 })
    }

    if (error.code === "auth/wrong-password") {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 })
    }

    if (error.code === "auth/invalid-email") {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }

    if (error.code === "auth/too-many-requests") {
      return NextResponse.json({ error: "Too many failed login attempts. Please try again later." }, { status: 429 })
    }

    if (error.code === "auth/user-disabled") {
      return NextResponse.json({ error: "This account has been disabled. Please contact support." }, { status: 403 })
    }

    if (error.code === "auth/invalid-credential") {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Generic error response
    return NextResponse.json(
      {
        error: "Login failed. Please check your credentials and try again.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
