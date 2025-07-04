import { NextResponse } from "next/server"
import { UnifiedAuthService } from "@/lib/services/unified-auth-service"

export async function POST() {
  try {
    console.log("🚪 [API:logout] Processing logout request")

    // Use unified auth service for sign out
    const authResult = await UnifiedAuthService.signOut()

    if (!authResult.success) {
      console.log("❌ [API:logout] Logout failed:", authResult.error?.message)
      return NextResponse.json(
        {
          error: authResult.error?.message || "Logout failed",
          success: false,
        },
        { status: 500 },
      )
    }

    console.log("✅ [API:logout] Logout successful")

    return NextResponse.json({
      success: true,
      message: authResult.message || "Logged out successfully",
    })
  } catch (error: any) {
    console.error("💥 [API:logout] Unexpected error:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred during logout",
        success: false,
      },
      { status: 500 },
    )
  }
}
