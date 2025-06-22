import { type NextRequest, NextResponse } from "next/server"
import { signupWithUniversalCode, createUser } from "@/lib/firebase/user-service"
import { signIn } from "@/lib/auth/auth-service"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, inviteCode, isTrainerSignup } = await request.json()

    console.log(`[Signup] 🔄 Processing signup:`, {
      name,
      email,
      hasPassword: !!password,
      inviteCode: inviteCode || "none",
      isTrainerSignup: !!isTrainerSignup,
    })

    if (!name || !email || !password) {
      console.log(`[Signup] ❌ Missing required fields`)
      return NextResponse.json(
        {
          success: false,
          error: "Name, email, and password are required",
        },
        { status: 400 },
      )
    }

    let result

    if (inviteCode) {
      console.log(`[Signup] 🎫 Signing up with invite code: ${inviteCode} (no role assigned)`)
      result = await signupWithUniversalCode({
        email,
        name,
        password,
        universalInviteCode: inviteCode,
      })

      if (!result.success) {
        console.log(`[Signup] ❌ Failed to signup with invite code:`, result.error)
        return NextResponse.json(
          {
            success: false,
            error: result.error?.message || "Failed to create account with invite code",
          },
          { status: 400 },
        )
      }

      console.log(`[Signup] ✅ Successfully signed up with invite code (user, no role)`)
      return NextResponse.json({
        success: true,
        userId: result.userId,
        pendingApproval: true,
        message: "Account created successfully. Waiting for trainer approval.",
      })
    } else {
      console.log(`[Signup] 👤 Regular signup - isTrainerSignup: ${isTrainerSignup}`)

      // Only assign trainer role if this is explicitly a trainer signup
      const role = isTrainerSignup ? "trainer" : undefined

      console.log(
        `[Signup] Creating user with role: ${role || "none"}${role === "trainer" ? " and trainer_basic plan" : ""}`,
      )

      result = await createUser({
        email,
        name,
        password,
        role: role, // undefined for regular users, "trainer" for trainers
        provider: "email",
      })

      if (!result.success) {
        console.log(`[Signup] ❌ Failed to create account:`, result.error)
        return NextResponse.json(
          {
            success: false,
            error: result.error?.message || "Failed to create account",
          },
          { status: 400 },
        )
      }

      console.log(`[Signup] ✅ Successfully created account with role: ${role || "none"} and trainer_basic plan`)

      // For trainer signups, automatically sign them in
      if (isTrainerSignup) {
        console.log(`[Signup] 🔐 Auto-signing in trainer after successful signup`)

        const signInResult = await signIn(email, password)

        if (signInResult.success) {
          console.log(`[Signup] ✅ Auto-signin successful for trainer`)
          return NextResponse.json({
            success: true,
            userId: result.userId,
            pendingApproval: false,
            autoSignedIn: true,
            role: "trainer",
            subscriptionPlan: role === "trainer" ? "trainer_basic" : undefined,
            message: "Account created and signed in successfully!",
          })
        } else {
          console.log(`[Signup] ⚠️ Auto-signin failed, but account was created:`, signInResult.error)
          return NextResponse.json({
            success: true,
            userId: result.userId,
            pendingApproval: false,
            autoSignedIn: false,
            role: "trainer",
            subscriptionPlan: role === "trainer" ? "trainer_basic" : undefined,
            message: "Account created successfully. Please log in.",
          })
        }
      }

      // For regular users (mobile app), don't auto-sign in
      return NextResponse.json({
        success: true,
        userId: result.userId,
        pendingApproval: false,
        autoSignedIn: false,
        role: role || "user",
        subscriptionPlan: role === "trainer" ? "trainer_basic" : undefined,
      })
    }
  } catch (error) {
    console.error("[Signup] ❌ Signup error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
