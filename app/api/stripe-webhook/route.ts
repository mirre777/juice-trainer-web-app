import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16", // Use the latest API version
})

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
    console.log(`✅ Received Stripe event: ${event.type}`)

    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case "invoice.paid":
        // await handleInvoicePaid(payload.data.object) // Removed payload and type
        console.log(`Unhandled event type: invoice.paid`)
        break
      case "customer.subscription.created":
        // await handleSubscriptionCreated(payload.data.object) // Removed payload and type
        console.log(`Unhandled event type: customer.subscription.created`)
        break
      case "customer.subscription.updated":
        // await handleSubscriptionUpdated(payload.data.object) // Removed payload and type
        console.log(`Unhandled event type: customer.subscription.updated`)
        break
      case "customer.subscription.deleted":
        // await handleSubscriptionDeleted(payload.data.object) // Removed payload and type
        console.log(`Unhandled event type: customer.subscription.deleted`)
        break
      // Add more event handlers as needed
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 })
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`💰 Payment succeeded: ${paymentIntent.id}`)
  // Add your business logic here
  // Update user subscription status in your database
  console.log("Payment succeeded:", paymentIntent.id)

  // Example: Update user subscription in database
  // await db.user.update({
  //   where: { id: paymentIntent.metadata.userId },
  //   data: {
  //     subscriptionStatus: 'active',
  //     subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  //   }
  // })
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`❌ Payment failed: ${paymentIntent.id}`)
  // Add your business logic here
  // Handle failed payment
  console.log("Payment failed:", paymentIntent.id)

  // Example: Log failed payment attempt
  // await db.paymentAttempt.create({
  //   data: {
  //     userId: paymentIntent.metadata.userId,
  //     paymentIntentId: paymentIntent.id,
  //     status: 'failed',
  //     errorMessage: paymentIntent.last_payment_error?.message
  //   }
  // })
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log(`🛒 Checkout completed: ${session.id}`)
  // Add your business logic here
  // Handle completed checkout session
  console.log("Checkout session completed:", session.id)

  // Example: Provision access based on checkout session
  // const customerId = session.customer
  // const subscriptionId = session.subscription
  // await db.user.update({
  //   where: { stripeCustomerId: customerId },
  //   data: {
  //     subscriptionId: subscriptionId,
  //     subscriptionStatus: 'active'
  //   }
  // })
}

async function handleInvoicePaid(invoice: any) {
  // Handle paid invoice
  console.log("Invoice paid:", invoice.id)

  // Example: Update subscription status based on invoice
  // await db.subscription.update({
  //   where: { stripeSubscriptionId: invoice.subscription },
  //   data: {
  //     status: 'active',
  //     currentPeriodEnd: new Date(invoice.lines.data[0].period.end * 1000)
  //   }
  // })
}

async function handleSubscriptionCreated(subscription: any) {
  // Handle subscription creation
  console.log("Subscription created:", subscription.id)

  // Example: Record new subscription
  // await db.subscription.create({
  //   data: {
  //     stripeSubscriptionId: subscription.id,
  //     userId: subscription.metadata.userId,
  //     status: subscription.status,
  //     priceId: subscription.items.data[0].price.id,
  //     currentPeriodStart: new Date(subscription.current_period_start * 1000),
  //     currentPeriodEnd: new Date(subscription.current_period_end * 1000)
  //   }
  // })
}

async function handleSubscriptionUpdated(subscription: any) {
  // Handle subscription update
  console.log("Subscription updated:", subscription.id)

  // Example: Update subscription record
  // await db.subscription.update({
  //   where: { stripeSubscriptionId: subscription.id },
  //   data: {
  //     status: subscription.status,
  //     currentPeriodStart: new Date(subscription.current_period_start * 1000),
  //     currentPeriodEnd: new Date(subscription.current_period_end * 1000)
  //   }
  // })
}

async function handleSubscriptionDeleted(subscription: any) {
  // Handle subscription deletion
  console.log("Subscription deleted:", subscription.id)

  // Example: Update subscription record
  // await db.subscription.update({
  //   where: { stripeSubscriptionId: subscription.id },
  //   data: {
  //     status: 'canceled',
  //     canceledAt: new Date()
  //   }
  // })
}
