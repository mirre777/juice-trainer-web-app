import { NextResponse } from "next/server"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase/firebase"
import { getUserByEmail } from "@/lib/firebase/user-service"

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

    // Check if user exists in Firestore
    const user = await getUserByEmail(email)

    if (!user) {
      console.log(`[API:login] ❌ User not found in Firestore: ${email}`)
      // If user doesn't exist and has invitation code, suggest signup
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
        console.log(`[API:login] 🔍 Checking invitation code after Firebase auth...`)
        console.log(`[API:login] 🎫 invitationCode value:`, invitationCode)
        console.log(`[API:login] 🎫 invitationCode truthy:`, !!invitationCode)

        // After successful Firebase authentication, check for invitation code
        if (invitationCode) {
          console.log(`[API:login] 🎯 ENTERING invitation code processing for: ${invitationCode}`)

          try {
            // Store the invitation code in the user document
            console.log(`[API:login] 💾 About to store invitation code...`)
            const { storeInvitationCode } = await import("@/lib/firebase/user-service")
            console.log(`[API:login] 📦 storeInvitationCode function imported successfully`)

            console.log(`[API:login] 🔄 Calling storeInvitationCode with userId: ${user.id}, code: ${invitationCode}`)
            const storeResult = await storeInvitationCode(user.id, invitationCode)
            console.log(`[API:login] 📋 storeInvitationCode result:`, storeResult)

            if (storeResult.success) {
              console.log(`[API:login] ✅ Successfully stored invitation code ${invitationCode} for user ${user.id}`)
            } else {
              console.error(`[API:login] ❌ Failed to store invitation code:`, storeResult.error)
            }

            // Process the invitation (add to pending users, etc.)
            console.log(`[API:login] 🔄 Processing login invitation...`)
            const { processLoginInvitation } = await import("@/lib/firebase/client-service")
            const inviteResult = await processLoginInvitation(invitationCode, user.id)
            console.log(`[API:login] 📋 processLoginInvitation result:`, inviteResult)

            if (inviteResult.success) {
              console.log(`[API:login] ✅ Successfully processed invitation for user ${user.id}`)

              // Update the response to indicate successful linking
              const response = NextResponse.json({
                success: true,
                userId: user.id,
                message: "Login successful! Your request has been sent to the trainer.",
                authMethod: "firebase",
                invitationProcessed: true,
                pendingApproval: true,
              })

              // Set cookies and return
              response.cookies.set("auth_token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 7, // 1 week
                path: "/",
              })

              response.cookies.set("user_id", user.id, {
                httpOnly: false,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 7, // 1 week
                path: "/",
              })

              return response
            } else {
              console.log(
                `[API:login] ⚠️ Could not process invitation: ${inviteResult.error?.message || "Unknown error"}`,
              )
              console.log(`[API:login] 📋 Full invitation error:`, inviteResult.error)
            }
          } catch (inviteError) {
            console.error(`[API:login] 💥 Error during invitation processing:`, inviteError)
          }
        } else {
          console.log(`[API:login] ℹ️ No invitation code provided, skipping invitation processing`)
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
          maxAge: 60 * 60 * 24 * 7, // 1 week
          path: "/",
        })

        response.cookies.set("user_id", user.id, {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 1 week
          path: "/",
        })

        return response
      } catch (firebaseError: any) {
        console.error("[API:login] ❌ Firebase Auth error:", firebaseError.code, firebaseError.message)

        // Handle specific Firebase Auth errors with detailed messages
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
      // Legacy user without Firebase Auth - first check if they exist in Firebase Auth
      console.log(`[API:login] 🔄 Legacy user detected (no hasFirebaseAuth): ${email}`)

      // Check if user exists in Firebase Auth but isn't linked
      try {
        console.log(`[API:login] 🔍 Checking if user exists in Firebase Auth but isn't linked`)

        // Try to sign in first - if successful, they exist in Firebase Auth
        const existingUserCredential = await signInWithEmailAndPassword(auth, email, password)
        const existingFirebaseUser = existingUserCredential.user

        console.log(`[API:login] ✅ User exists in Firebase Auth, linking accounts automatically`)
        console.log(`[API:login] Firebase UID: ${existingFirebaseUser.uid}`)

        // Update Firestore user to link with existing Firebase Auth account
        const { updateUser } = await import("@/lib/firebase/user-service")
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

        // Get Firebase Auth token
        const token = await existingFirebaseUser.getIdToken()

        console.log(`[API:login] 🔗 Successfully auto-linked accounts during login`)

        // Store the invitation code in the user document (same as signup)
        if (invitationCode) {
          console.log(`[API:login] 🎯 Processing invitation code during auto-link: ${invitationCode}`)

          // Store the invitation code
          console.log(`[API:login] 💾 Attempting to store invitation code ${invitationCode} for user ${user.id}`)
          const { storeInvitationCode } = await import("@/lib/firebase/user-service")
          const storeResult = await storeInvitationCode(user.id, invitationCode)

          if (storeResult.success) {
            console.log(`[API:login] ✅ Stored invitation code ${invitationCode} for user ${user.id}`)
          } else {
            console.error(`[API:login] ❌ Failed to store invitation code:`, storeResult.error)
          }

          // Process the invitation (add to pending users, etc.)
          console.log(`[API:login] 🔄 Processing login invitation during auto-link...`)
          const { processLoginInvitation } = await import("@/lib/firebase/client-service")
          const inviteResult = await processLoginInvitation(invitationCode, user.id)
          console.log(`[API:login] 📋 processLoginInvitation result (auto-link):`, inviteResult)

          if (inviteResult.success) {
            console.log(`[API:login] ✅ Successfully processed invitation for auto-linked user ${user.id}`)

            // Update the response to indicate successful linking
            const response = NextResponse.json({
              success: true,
              userId: user.id,
              message: "Login successful! Your request has been sent to the trainer.",
              authMethod: "firebase",
              autoLinked: true,
              invitationProcessed: true,
              pendingApproval: true,
            })

            // Set cookies and return
            response.cookies.set("auth_token", token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 7, // 1 week
              path: "/",
            })

            response.cookies.set("user_id", user.id, {
              httpOnly: false,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 7, // 1 week
              path: "/",
            })

            return response
          }
        }

        // Set auth cookie with Firebase token
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
          maxAge: 60 * 60 * 24 * 7, // 1 week
          path: "/",
        })

        response.cookies.set("user_id", user.id, {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 1 week
          path: "/",
        })

        return response
      } catch (linkCheckError: any) {
        console.log(`[API:login] Link check result:`, linkCheckError.code, linkCheckError.message)

        // If wrong password, return specific auth error immediately
        if (linkCheckError.code === "auth/wrong-password") {
          console.log(`[API:login] ❌ Wrong password for existing Firebase Auth account`)
          return NextResponse.json(
            { error: "Incorrect password. Please check your password and try again." },
            { status: 401 },
          )
        }

        // If user not found in Firebase Auth, proceed with account creation
        if (linkCheckError.code === "auth/user-not-found") {
          console.log(`[API:login] 🆕 User not in Firebase Auth, creating new account`)

          try {
            // Create Firebase Auth account with the provided password
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
            const firebaseUser = userCredential.user

            console.log(`[API:login] ✅ Firebase Auth account created successfully!`)
            console.log(`[API:login] Firebase UID: ${firebaseUser.uid}`)

            // Update user document to reflect Firebase Auth migration
            const { updateUser } = await import("@/lib/firebase/user-service")
            const updateResult = await updateUser(user.id, {
              hasFirebaseAuth: true,
              firebaseUid: firebaseUser.uid,
              migratedAt: new Date(),
            })

            if (!updateResult.success) {
              console.error("[API:login] ❌ Failed to update user document:", updateResult.error)
              return NextResponse.json(
                { error: "Failed to complete account setup. Please try again." },
                { status: 500 },
              )
            }

            // Get Firebase Auth token
            const token = await firebaseUser.getIdToken()

            console.log(`[API:login] 🎉 Legacy user successfully migrated to Firebase Auth: ${user.id}`)

            // Process invitation code if provided
            if (invitationCode) {
              console.log(`[API:login] 🎯 Processing invitation code after migration: ${invitationCode}`)

              // Store the invitation code
              console.log(
                `[API:login] 💾 Attempting to store invitation code ${invitationCode} for migrated user ${user.id}`,
              )
              const { storeInvitationCode } = await import("@/lib/firebase/user-service")
              const storeResult = await storeInvitationCode(user.id, invitationCode)

              if (storeResult.success) {
                console.log(`[API:login] ✅ Stored invitation code ${invitationCode} for migrated user ${user.id}`)
              } else {
                console.error(`[API:login] ❌ Failed to store invitation code for migrated user:`, storeResult.error)
              }

              // Process the invitation (add to pending users, etc.)
              console.log(`[API:login] 🔄 Processing login invitation after migration...`)
              const { processLoginInvitation } = await import("@/lib/firebase/client-service")
              const inviteResult = await processLoginInvitation(invitationCode, user.id)
              console.log(`[API:login] 📋 processLoginInvitation result (migration):`, inviteResult)

              if (inviteResult.success) {
                console.log(`[API:login] ✅ Successfully processed invitation for migrated user ${user.id}`)

                // Update the response to indicate successful linking
                const response = NextResponse.json({
                  success: true,
                  userId: user.id,
                  message: "Login successful! Your request has been sent to the trainer.",
                  authMethod: "firebase",
                  migrated: true,
                  invitationProcessed: true,
                  pendingApproval: true,
                })

                // Set cookies and return
                response.cookies.set("auth_token", token, {
                  httpOnly: true,
                  secure: process.env.NODE_ENV === "production",
                  sameSite: "lax",
                  maxAge: 60 * 60 * 24 * 7, // 1 week
                  path: "/",
                })

                response.cookies.set("user_id", user.id, {
                  httpOnly: false,
                  secure: process.env.NODE_ENV === "production",
                  sameSite: "lax",
                  maxAge: 60 * 60 * 24 * 7, // 1 week
                  path: "/",
                })

                return response
              }
            }

            // Set auth cookie with Firebase token
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
              maxAge: 60 * 60 * 24 * 7, // 1 week
              path: "/",
            })

            response.cookies.set("user_id", user.id, {
              httpOnly: false,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 7, // 1 week
              path: "/",
            })

            return response
          } catch (createError: any) {
            console.error(
              "[API:login] ❌ Failed to create Firebase Auth account:",
              createError.code,
              createError.message,
            )

            // Handle specific creation errors with detailed messages
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

        // Handle other link check errors
        if (linkCheckError.code === "auth/too-many-requests") {
          return NextResponse.json(
            { error: "Too many failed login attempts. Please wait a few minutes before trying again." },
            { status: 429 },
          )
        }

        // For other errors during link check
        console.error("[API:login] ❌ Unexpected error during link check:", linkCheckError)
        return NextResponse.json({ error: `Authentication failed: ${linkCheckError.message}` }, { status: 401 })
      }
    }
  } catch (error: any) {
    console.error("[API:login] ❌ Unexpected error:", error)
    console.error("[API:login] Error name:", error.name)
    console.error("[API:login] Error message:", error.message)
    console.error("[API:login] Error code:", error.code)
    console.error("[API:login] Error stack:", error.stack)

    // Try to get more details if it's a Firebase error
    if (error.code && error.code.startsWith("auth/")) {
      console.error("[API:login] Firebase Auth error details:", {
        code: error.code,
        message: error.message,
        customData: error.customData,
      })
    }

    // Try to get more details if it's a Firestore error
    if (error.code && error.code.startsWith("firestore/")) {
      console.error("[API:login] Firestore error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
      })
    }

    // Check for network errors
    if (error.name === "NetworkError" || error.message?.includes("network")) {
      console.error("[API:login] Possible network connectivity issue")
      return NextResponse.json(
        {
          error: "Unable to connect to authentication service. Please check your network connection and try again.",
        },
        { status: 503 },
      )
    }

    // Check for timeout errors
    if (error.name === "TimeoutError" || error.message?.includes("timeout")) {
      console.error("[API:login] Request timed out")
      return NextResponse.json(
        {
          error: "Authentication request timed out. Please try again later.",
        },
        { status: 504 },
      )
    }

    // Check for Firebase configuration errors
    if (error.message?.includes("API key") || error.message?.includes("project ID")) {
      console.error("[API:login] Firebase configuration error")
      return NextResponse.json(
        {
          error: "Authentication service misconfigured. Please contact support.",
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        error: "An unexpected error occurred. Please try again later.",
        errorId: new Date().getTime().toString(36), // Add a unique error ID for tracking
      },
      { status: 500 },
    )
  }
}
