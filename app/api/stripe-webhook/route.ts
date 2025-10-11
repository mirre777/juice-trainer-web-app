import { updateSubscriptionPlan } from "@/lib/firebase/subscription-service"
import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { SubscriptionPlan } from "@/lib/firebase/subscription-service"

// Initialize Stripe with the secret key
const apiKey = process.env.STRIPE_SECRET_KEY
const stripe = new Stripe(apiKey || "")

export async function POST(request: NextRequest) {
  try {
    // Get the request body as text for signature verification
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")

    let event: Stripe.Event

    try {
      // Verify the webhook signature
      if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
        // For development, allow without verification
        event = JSON.parse(body) as Stripe.Event
        console.warn("⚠️ Webhook signature verification skipped")
      } else {
        // For production, verify the signature
        event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
      }
    } catch (err) {
      console.error(`⚠️ Webhook signature verification failed: ${err instanceof Error ? err.message : "Unknown error"}`)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    // Handle the event
    console.log(`✅ Received Stripe event: ${event.type} and event data: ${JSON.stringify(event.data.object)}`)

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 })
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log(`🛒 Checkout completed: ${session.id}`)
  // Add your business logic here
  console.log("Checkout session completed:", session.id)
  if (session.payment_status === 'paid') {

    const planId = session.metadata?.plan_id
    const userId = session.client_reference_id
    const stripeUserId = session.customer as string
    if (!userId || !planId) {
      console.error("Missing required parameters", session)
      return
    }

    console.log("Updating subscription plan for user", userId, "with stripe user id", stripeUserId, "and plan id", planId)
    // Update user's subscription plan
    const result = await updateSubscriptionPlan(userId, stripeUserId, planId as SubscriptionPlan)
    if (!result.success) {
      console.error("Failed to update subscription plan", result.error)
      return
    }
  }
}

