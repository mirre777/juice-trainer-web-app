import { type NextRequest, NextResponse } from "next/server"
import { signupWithUniversalCode, createUser } from "@/lib/firebase/user-service"
import { signUp } from "@/lib/auth/auth-service"

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

    // Create authenticaition user in firebase
    const signUpResult = await signUp(email, password)
    if (!signUpResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: signUpResult.error,
        },
        { status: 400 },
      )
    }

    let result
    if (inviteCode && !isTrainerSignup) {
      console.log(`[Signup] 🎫 Signing up with invite code: ${inviteCode} (no role assigned)`)
      result = await signupWithUniversalCode(
        email,
        name,
        inviteCode,
      )

      if (!result.success) {
        console.log(`[Signup] ❌ Failed to signup with invite code:`, result.message)
        return NextResponse.json(
          {
            success: false,
            error: result.message || "Failed to create account with invite code",
          },
          { status: 400 },
        )
      }

      console.log(`[Signup] ✅ Successfully signed up with invite code (user, no role)`)
      return NextResponse.json({
        success: true,
        userId: result.userId,
        pendingApproval: true,
        autoSignedIn: false,
        role: "client",
        subscriptionPlan: "client_basic",
        message: "Account created successfully. Waiting for trainer approval.",
      })
    } else {
      console.log(`[Signup] 👤 Regular signup - isTrainerSignup: ${isTrainerSignup}`)

      // Only assign trainer role if this is explicitly a trainer signup
      const role = isTrainerSignup ? "trainer" : "client"

      console.log(
        `[Signup] Creating user with role: ${role || "none"}${role === "trainer" ? " and trainer_basic plan" : ""}`,
      )

      result = await createUser({
        email,
        name,
        role: role, // undefined for regular users, "trainer" for trainers
      })

      console.log(`[Signup] ✅ Successfully created account with role: ${role || "none"} and trainer_basic plan`)

      return NextResponse.json({
        success: true,
        userId: result.id,
        pendingApproval: false,
        autoSignedIn: isTrainerSignup,
        role,
        subscriptionPlan: role === "trainer" ? "trainer_basic" : "client_basic",
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
