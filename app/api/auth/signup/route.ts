import { type NextRequest, NextResponse } from "next/server"
import { createUser, User } from "@/lib/firebase/user-service"
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
    const { success, error, user } = await signUp(email, password)
    if (!success || !user) {
      return NextResponse.json(
        {
          success: false,
          error: error,
        },
        { status: 400 },
      )
    }

    console.log(`[Signup] 👤 signup with invite code: ${inviteCode} - isTrainerSignup: ${isTrainerSignup}`)

      // Only assign trainer role if this is explicitly a trainer signup
      const role = isTrainerSignup ? "trainer" : "client"

      console.log(
        `[Signup] Creating user with role: ${role || "none"}${role === "trainer" ? " and trainer_basic plan" : ""}`,
      )

      const newUser = {
        email,
        name,
        role: role,
        ...(inviteCode && { inviteCode }),
      } as Omit<User, "id" | "createdAt" | "updatedAt">
      await createUser(user.uid, newUser)

      console.log(`[Signup] ✅ Successfully created account with role: ${role || "none"} and trainer_basic plan`)

      return NextResponse.json({
        success: true,
        userId: user.uid,
        pendingApproval: false,
        autoSignedIn: isTrainerSignup,
        role,
        subscriptionPlan: role === "trainer" ? "trainer_basic" : "client_basic",
      })
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
