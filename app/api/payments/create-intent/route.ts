"use server"
import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = "eur", userId, planId } = await request.json()

    if (!amount || !userId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }
    const apiKey = process.env.STRIPE_SECRET_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "STRIPE_SECRET_KEY is not set" }, { status: 500 })
    }

    // In a real implementation, you would create a payment intent with Stripe
    const stripe = new Stripe(apiKey)
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: { userId, planId },
    })
    console.log("paymentIntent", paymentIntent)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 })
  }
}
