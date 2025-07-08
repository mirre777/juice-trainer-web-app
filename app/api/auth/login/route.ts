import { NextResponse } from "next/server"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase/firebase"
import { getUserByEmail, updateUser, storeInvitationCode } from "@/lib/firebase/user-service"

export async function POST(request: Request) {
  try {
    const { email, password, invitationCode } = await request.json()

    console.log(`[API:login] 🚀 Processing login for ${email}`)

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Check if user exists in Firestore with proper error handling
    let user = null
    try {
      console.log(`[API:login] 🔍 Checking if user exists in Firestore...`)
      user = await getUserByEmail(email)
      console.log(`[API:login] 📋 getUserByEmail result:`, user ? "User found" : "User not found")
    } catch (firestoreError: any) {
      console.error(`[API:login] ❌ Firestore error when checking user:`, firestoreError)
      return NextResponse.json(
        {
          error: "Database error occurred while checking user account",
          details: process.env.NODE_ENV === "development" ? firestoreError.message : undefined,
        },
        { status: 500 },
      )
    }

    if (!user) {
      console.log(`[API:login] ❌ User not found in Firestore: ${email}`)
      if (invitationCode) {
        return NextResponse.json(
          {
            error: "Account not found. Please sign up first.",
            suggestSignup: true,
          },
          { status: 404 },
        )
      }
      return NextResponse.json({ error: "No account found with this email address" }, { status: 404 })
    }

    console.log(`[API:login] ✅ User found in Firestore:`, {
      id: user.id,
      email: user.email,
      hasFirebaseAuth: user.hasFirebaseAuth,
      role: user.role,
      existingInviteCode: user.inviteCode || "none",
    })

    // Check if user has Firebase Auth
    if (user.hasFirebaseAuth) {
      console.log(`[API:login] 🔐 User has Firebase Auth, authenticating with Firebase`)

      try {
        // Authenticate with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const firebaseUser = userCredential.user

        // Get Firebase Auth token
        const token = await firebaseUser.getIdToken()

        console.log(`[API:login] ✅ Firebase Auth successful for user: ${user.id}`)

        // After successful Firebase authentication, check for invitation code
        if (invitationCode) {
          console.log(`[API:login] 🎯 ENTERING invitation code processing for: ${invitationCode}`)

          try {
            // Store the invitation code in the user document
            const storeResult = await storeInvitationCode(user.id, invitationCode)

            if (storeResult.success) {
              console.log(`[API:login] ✅ Successfully stored invitation code ${invitationCode} for user ${user.id}`)
            } else {
              console.error(`[API:login] ❌ Failed to store invitation code:`, storeResult.error)
            }

            // Try to process the invitation if client service is available
            try {
              const { processLoginInvitation } = await import("@/lib/firebase/client-service")
              const inviteResult = await processLoginInvitation(invitationCode, user.id)

              if (inviteResult.success) {
                console.log(`[API:login] ✅ Successfully processed invitation for user ${user.id}`)

                const response = NextResponse.json({
                  success: true,
                  userId: user.id,
                  message: "Login successful! Your request has been sent to the trainer.",
                  authMethod: "firebase",
                  invitationProcessed: true,
                  pendingApproval: true,
                })

                response.cookies.set("auth_token", token, {
                  httpOnly: true,
                  secure: process.env.NODE_ENV === "production",
                  sameSite: "lax",
                  maxAge: 60 * 60 * 24 * 7,
                  path: "/",
                })

                response.cookies.set("user_id", user.id, {
                  httpOnly: false,
                  secure: process.env.NODE_ENV === "production",
                  sameSite: "lax",
                  maxAge: 60 * 60 * 24 * 7,
                  path: "/",
                })

                return response
              }
            } catch (clientServiceError) {
              console.error(
                `[API:login] ❌ Client service not available, continuing without invitation processing:`,
                clientServiceError,
              )
              // Continue with normal login flow even if invitation processing fails
            }
          } catch (inviteError) {
            console.error(`[API:login] 💥 Error during invitation processing:`, inviteError)
            // Continue with normal login flow even if invitation processing fails
          }
        }

        // Set auth cookie with Firebase token
        const response = NextResponse.json({
          success: true,
          userId: user.id,
          message: "Login successful!",
          authMethod: "firebase",
        })

        response.cookies.set("auth_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        })

        response.cookies.set("user_id", user.id, {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        })

        return response
      } catch (firebaseError: any) {
        console.error("[API:login] ❌ Firebase Auth error:", firebaseError.code, firebaseError.message)

        if (firebaseError.code === "auth/wrong-password") {
          return NextResponse.json(
            { error: "Incorrect password. Please check your password and try again." },
            { status: 401 },
          )
        } else if (firebaseError.code === "auth/user-not-found") {
          return NextResponse.json({ error: "No account found with this email address." }, { status: 401 })
        } else if (firebaseError.code === "auth/too-many-requests") {
          return NextResponse.json(
            { error: "Too many failed login attempts. Please wait a few minutes before trying again." },
            { status: 429 },
          )
        } else if (firebaseError.code === "auth/user-disabled") {
          return NextResponse.json(
            { error: "This account has been disabled. Please contact support." },
            { status: 403 },
          )
        } else if (firebaseError.code === "auth/invalid-email") {
          return NextResponse.json({ error: "Invalid email address format." }, { status: 400 })
        }

        return NextResponse.json({ error: `Authentication failed: ${firebaseError.message}` }, { status: 401 })
      }
    } else {
      // Legacy user without Firebase Auth
      console.log(`[API:login] 🔄 Legacy user detected (no hasFirebaseAuth): ${email}`)

      try {
        const existingUserCredential = await signInWithEmailAndPassword(auth, email, password)
        const existingFirebaseUser = existingUserCredential.user

        console.log(`[API:login] ✅ User exists in Firebase Auth, linking accounts automatically`)

        const updateResult = await updateUser(user.id, {
          hasFirebaseAuth: true,
          firebaseUid: existingFirebaseUser.uid,
          linkedAt: new Date(),
          linkedDuring: "login",
        })

        if (!updateResult.success) {
          console.error("[API:login] ❌ Failed to update user document:", updateResult.error)
          return NextResponse.json({ error: "Failed to link accounts. Please try again." }, { status: 500 })
        }

        const token = await existingFirebaseUser.getIdToken()

        const response = NextResponse.json({
          success: true,
          userId: user.id,
          message: "Login successful! Your account has been upgraded for enhanced security.",
          authMethod: "firebase",
          autoLinked: true,
        })

        response.cookies.set("auth_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        })

        response.cookies.set("user_id", user.id, {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        })

        return response
      } catch (linkCheckError: any) {
        if (linkCheckError.code === "auth/wrong-password") {
          return NextResponse.json(
            { error: "Incorrect password. Please check your password and try again." },
            { status: 401 },
          )
        }

        if (linkCheckError.code === "auth/user-not-found") {
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
            const firebaseUser = userCredential.user

            const updateResult = await updateUser(user.id, {
              hasFirebaseAuth: true,
              firebaseUid: firebaseUser.uid,
              migratedAt: new Date(),
            })

            if (!updateResult.success) {
              return NextResponse.json(
                { error: "Failed to complete account setup. Please try again." },
                { status: 500 },
              )
            }

            const token = await firebaseUser.getIdToken()

            const response = NextResponse.json({
              success: true,
              userId: user.id,
              message: "Login successful! Your account has been upgraded for enhanced security.",
              authMethod: "firebase",
              migrated: true,
            })

            response.cookies.set("auth_token", token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 7,
              path: "/",
            })

            response.cookies.set("user_id", user.id, {
              httpOnly: false,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 7,
              path: "/",
            })

            return response
          } catch (createError: any) {
            console.error(
              "[API:login] ❌ Failed to create Firebase Auth account:",
              createError.code,
              createError.message,
            )

            if (createError.code === "auth/email-already-in-use") {
              return NextResponse.json(
                {
                  error:
                    "An account with this email already exists in our system. Please try logging in or contact support.",
                },
                { status: 409 },
              )
            } else if (createError.code === "auth/weak-password") {
              return NextResponse.json(
                { error: "Password is too weak. Please use at least 6 characters with a mix of letters and numbers." },
                { status: 400 },
              )
            } else if (createError.code === "auth/invalid-email") {
              return NextResponse.json({ error: "Invalid email address format." }, { status: 400 })
            }

            return NextResponse.json({ error: `Failed to create account: ${createError.message}` }, { status: 500 })
          }
        }

        if (linkCheckError.code === "auth/too-many-requests") {
          return NextResponse.json(
            { error: "Too many failed login attempts. Please wait a few minutes before trying again." },
            { status: 429 },
          )
        }

        console.error("[API:login] ❌ Unexpected error during link check:", linkCheckError)
        return NextResponse.json({ error: `Authentication failed: ${linkCheckError.message}` }, { status: 401 })
      }
    }
  } catch (error: any) {
    console.error("[API:login] ❌ Unexpected error:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred during login. Please try again later.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
