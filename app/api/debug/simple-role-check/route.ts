export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { getUserProfile } from "@/lib/firebase/user-service"

export async function GET() {
  try {
    console.log("🔍 Simple role check starting...")

    const email = "mirresnelting@gmail.com"

    console.log("📧 Checking user profile for:", email)

    const userProfile = await getUserProfile(email)

    const result = {
      timestamp: new Date().toISOString(),
      email: email,
      found: !!userProfile,
      profile: userProfile
        ? {
            uid: userProfile.uid,
            email: userProfile.email,
            name: userProfile.name,
            role: userProfile.role,
            user_type: userProfile.user_type,
            roleType: typeof userProfile.role,
            rawRole: JSON.stringify(userProfile.role),
          }
        : null,
    }

    console.log("✅ Role check result:", result)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("❌ Role check failed:", error)
    return NextResponse.json(
      {
        error: "Role check failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
