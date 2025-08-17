import { NextResponse } from "next/server"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase/firebase"
import { getUserByEmail, updateUser, storeInviteCode } from "@/lib/firebase/user-service"

export async function POST(request: Request) {
  try {
    const { email, password, inviteCode } = await request.json()

    console.log(`[API:login] Processing login for ${email}`)

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    let user = null
    try {
      user = await getUserByEmail(email)
    } catch (firestoreError: any) {
      console.error(`[API:login] Firestore error:`, firestoreError)
      return NextResponse.json(
        {
          error: "Database error occurred while checking user account",
          details: process.env.NODE_ENV === "development" ? firestoreError.message : undefined,
        },
        { status: 500 },
      )
    }

    if (!user) {
      console.log(`[API:login] User not found: ${email}`)
      if (inviteCode) {
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

    console.log(`[API:login] User found:`, {
      id: user.id,
      email: user.email,
      hasFirebaseAuth: user.hasFirebaseAuth,
      role: user.role,
    })

    if (user.hasFirebaseAuth) {
      console.log(`[API:login] User has Firebase Auth, authenticating`)

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const firebaseUser = userCredential.user

        const token = await firebaseUser.getIdToken()

        console.log(`[API:login] Firebase Auth successful for user: ${user.id}`)

        if (inviteCode) {
          console.log(`[API:login] Processing invitation code: ${inviteCode}`)

          try {
            await storeInviteCode(user.id, inviteCode)

            try {
              const { processLoginInvitation } = await import("@/lib/firebase/client-service")
              const inviteResult = await processLoginInvitation(inviteCode, user.id)

              if (inviteResult.success) {
                console.log(`[API:login] Successfully processed invitation`)

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
              console.error(`[API:login] Client service not available:`, clientServiceError)
            }
          } catch (inviteError) {
            console.error(`[API:login] Error during invitation processing:`, inviteError)
          }
        }

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
        console.error("[API:login] Firebase Auth error:", firebaseError.code, firebaseError.message)

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
      console.log(`[API:login] Legacy user detected: ${email}`)

      try {
        const existingUserCredential = await signInWithEmailAndPassword(auth, email, password)
        const existingFirebaseUser = existingUserCredential.user

        console.log(`[API:login] User exists in Firebase Auth, linking accounts`)

        const updateResult = await updateUser(user.id, {
          hasFirebaseAuth: true,
          firebaseUid: existingFirebaseUser.uid,
        })

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
            })

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
            console.error("[API:login] Failed to create Firebase Auth account:", createError.code, createError.message)

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

        console.error("[API:login] Unexpected error during link check:", linkCheckError)
        return NextResponse.json({ error: `Authentication failed: ${linkCheckError.message}` }, { status: 401 })
      }
    }
  } catch (error: any) {
    console.error("[API:login] Unexpected error:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred during login. Please try again later.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
