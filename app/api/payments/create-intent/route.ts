import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = "usd", userId, planId } = await request.json()

    if (!amount || !userId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // In a real implementation, you would create a payment intent with Stripe
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount,
    //   currency,
    //   metadata: { userId, planId },
    // })

    // For demo purposes, we'll create a mock payment intent
    const mockPaymentIntent = {
      id: `pi_${Math.random().toString(36).substring(2, 15)}`,
      client_secret: `pi_${Math.random().toString(36).substring(2, 15)}_secret_${Math.random().toString(36).substring(2, 15)}`,
      amount,
      currency,
      metadata: { userId, planId },
    }

    return NextResponse.json({
      clientSecret: mockPaymentIntent.client_secret,
      paymentIntentId: mockPaymentIntent.id,
    })
  } catch (error) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 })
  }
}
