import { NextResponse } from "next/server"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase/firebase"
import { UnifiedAuthService } from "@/lib/services/unified-auth-service"
import { processInvitation, findClientByInvitationCode } from "@/lib/firebase/client-service"

export async function POST(request: Request) {
  try {
    const { email, password, name, invitationCode, isTrainerSignup } = await request.json()

    console.log(`[API:signup] 🚀 Processing signup for ${email}`)
    console.log(`[API:signup] 🎫 Invitation code:`, invitationCode)
    console.log(`[API:signup] 👨‍🏫 Is trainer signup:`, isTrainerSignup)

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 })
    }

    // Create Firebase Auth account
    console.log(`[API:signup] 🔐 Creating Firebase Auth account`)
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user

    console.log(`[API:signup] ✅ Firebase Auth account created: ${firebaseUser.uid}`)

    // Determine user role and type
    let userRole = "client"
    let userType = "mobile_app"

    if (isTrainerSignup) {
      userRole = "trainer"
      userType = "web_app"
    } else if (invitationCode) {
      // Check if invitation exists to determine if this is a client signup
      const inviteCheck = await findClientByInvitationCode(invitationCode)
      if (inviteCheck.exists) {
        userRole = "client"
        userType = "mobile_app"
      }
    }

    // Create user document in Firestore
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: userRole,
      user_type: userType,
      hasFirebaseAuth: true,
      firebaseUid: firebaseUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: "active",
      ...(invitationCode && { inviteCode: invitationCode }),
    }

    console.log(`[API:signup] 📝 Creating user document with role: ${userRole}`)
    const userRef = doc(db, "users", firebaseUser.uid)
    await setDoc(userRef, userData)

    console.log(`[API:signup] ✅ User document created successfully`)

    // Process invitation if provided
    if (invitationCode) {
      console.log(`[API:signup] 🎯 Processing invitation: ${invitationCode}`)
      try {
        const inviteResult = await processInvitation(invitationCode, firebaseUser.uid)
        if (inviteResult.success) {
          console.log(`[API:signup] ✅ Invitation processed successfully`)
        } else {
          console.log(`[API:signup] ⚠️ Invitation processing failed:`, inviteResult.error?.message)
        }
      } catch (inviteError) {
        console.error(`[API:signup] 💥 Error processing invitation:`, inviteError)
      }
    }

    // For trainer signups, try to auto-sign them in
    let autoSignedIn = false
    if (isTrainerSignup) {
      try {
        console.log(`[API:signup] 🔄 Attempting auto-signin for trainer`)
        const signInResult = await UnifiedAuthService.signIn(email, password)

        if (signInResult.success) {
          console.log(`[API:signup] ✅ Auto-signin successful`)
          autoSignedIn = true

          // Get Firebase token for cookies
          const token = await firebaseUser.getIdToken()

          const response = NextResponse.json({
            success: true,
            userId: firebaseUser.uid,
            message: "Account created and signed in successfully!",
            autoSignedIn: true,
            role: userRole,
          })

          // Set auth cookies
          response.cookies.set("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
          })

          response.cookies.set("user_id", firebaseUser.uid, {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
          })

          return response
        } else {
          console.log(`[API:signup] ⚠️ Auto-signin failed:`, signInResult.error?.message)
        }
      } catch (autoSignInError) {
        console.error(`[API:signup] 💥 Auto-signin error:`, autoSignInError)
      }
    }

    // Return success response
    console.log(`[API:signup] 🎉 Signup completed successfully`)
    return NextResponse.json({
      success: true,
      userId: firebaseUser.uid,
      message: "Account created successfully!",
      autoSignedIn,
      role: userRole,
      requiresLogin: !autoSignedIn,
    })
  } catch (error: any) {
    console.error("[API:signup] ❌ Signup error:", error)

    // Handle specific Firebase errors
    if (error.code === "auth/email-already-in-use") {
      return NextResponse.json(
        { error: "An account with this email already exists. Please try logging in instead." },
        { status: 409 },
      )
    } else if (error.code === "auth/weak-password") {
      return NextResponse.json({ error: "Password is too weak. Please use at least 6 characters." }, { status: 400 })
    } else if (error.code === "auth/invalid-email") {
      return NextResponse.json({ error: "Invalid email address format." }, { status: 400 })
    }

    return NextResponse.json({ error: error.message || "An unexpected error occurred during signup." }, { status: 500 })
  }
}
