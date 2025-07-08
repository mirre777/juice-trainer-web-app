import { NextResponse } from "next/server"
import { getUserProfile } from "@/lib/firebase/user-service"

export async function GET() {
  try {
    console.log("[DEBUG] Simple role check starting...")

    // Test with your email
    const testEmail = "mirresnelting@gmail.com"

    console.log(`[DEBUG] Testing with email: ${testEmail}`)

    const userProfile = await getUserProfile(testEmail)

    if (!userProfile) {
      return NextResponse.json({
        success: false,
        message: "User not found",
        email: testEmail,
      })
    }

    return NextResponse.json({
      success: true,
      message: "User found successfully",
      user: {
        uid: userProfile.uid,
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role,
        user_type: userProfile.user_type,
        roleType: typeof userProfile.role,
        rawRole: JSON.stringify(userProfile.role),
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("[DEBUG] Error in simple role check:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
