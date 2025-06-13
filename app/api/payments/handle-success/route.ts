import { type NextRequest, NextResponse } from "next/server"
import { updateSubscriptionPlan } from "@/lib/firebase/subscription-service"

export async function POST(request: NextRequest) {
  try {
    const { userId, planId, sessionId } = await request.json()

    console.log(`[Payment Success] Processing payment success for user: ${userId}, plan: ${planId}`)

    if (!userId || !planId) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 })
    }

    // Map plan IDs to subscription plans
    const planMapping: Record<string, "trainer_basic" | "trainer_pro" | "trainer_elite"> = {
      trainer_pro: "trainer_pro",
      trainer_elite: "trainer_elite",
    }

    const subscriptionPlan = planMapping[planId]
    if (!subscriptionPlan) {
      return NextResponse.json({ success: false, error: "Invalid plan ID" }, { status: 400 })
    }

    // Update user's subscription plan
    const result = await updateSubscriptionPlan(userId, subscriptionPlan)

    if (!result.success) {
      console.error(`[Payment Success] Failed to update subscription plan:`, result.error)
      return NextResponse.json({ success: false, error: "Failed to update subscription plan" }, { status: 500 })
    }

    console.log(`[Payment Success] ✅ Successfully updated user ${userId} to ${subscriptionPlan}`)

    return NextResponse.json({
      success: true,
      message: "Subscription plan updated successfully",
      subscriptionPlan,
    })
  } catch (error) {
    console.error("[Payment Success] ❌ Error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
