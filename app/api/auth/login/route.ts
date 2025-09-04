import { NextResponse } from "next/server"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase/firebase"
import { storeInviteCode, getUserByUid } from "@/lib/firebase/user-service"

export async function POST(request: Request) {
  try {
    const { email, password, inviteCode } = await request.json()

    console.log(`[API:login] Processing login for ${email} ${inviteCode}`)

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const firebaseUser = userCredential.user
        console.log(`[API:login] Firebase Auth successful for user: ${firebaseUser.uid}`)
        const token = await firebaseUser.getIdToken()
        const user = await getUserByUid(firebaseUser.uid)

        if (!user) {
          return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        console.log(`[API:login] User found: ${user.id}`)

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

        return NextResponse.json({ error: `The email or password is incorrect. Please try again` }, { status: 401 })
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
