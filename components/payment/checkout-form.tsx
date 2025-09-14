"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, AlertCircle } from "lucide-react"

interface CheckoutFormProps {
  planId: string
  planName: string
  amount: number
  userId: string
}

export default function CheckoutForm({ planId, planName, amount, userId }: CheckoutFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    // Format card number with spaces
    if (name === "number") {
      const formatted = value
        .replace(/\s/g, "")
        .replace(/(\d{4})/g, "$1 ")
        .trim()
      setCardDetails((prev) => ({ ...prev, [name]: formatted }))
      return
    }

    // Format expiry date with slash
    if (name === "expiry") {
      const cleaned = value.replace(/\D/g, "")
      let formatted = cleaned
      if (cleaned.length > 2) {
        formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`
      }
      setCardDetails((prev) => ({ ...prev, [name]: formatted }))
      return
    }

    setCardDetails((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // In a real implementation, you would use Stripe.js to collect and tokenize card details
      // For demo purposes, we'll simulate a payment flow

      // 1. Create a payment intent
      const response = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount * 100, // Convert to cents
          currency: "eur",
          userId,
          planId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to process payment")
      }

      // 2. Simulate successful payment confirmation
      // In a real implementation, you would use stripe.confirmCardPayment with the client secret

      // 3. Call handle-success endpoint to update subscription
      const successResponse = await fetch("/api/payments/handle-success", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          planId,
          sessionId: data.paymentIntentId, // Using payment intent ID as session ID
        }),
      })

      const successData = await successResponse.json()

      if (!successResponse.ok) {
        console.error("Failed to update subscription:", successData.error)
        // Still redirect to success page even if subscription update fails
        // The user can contact support if needed
      } else {
        console.log("✅ Subscription updated successfully:", successData)
      }

      // 4. Redirect to success page
      router.push(`/payment-success?payment_intent=${data.paymentIntentId}&user_id=${userId}`)
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md w-full mx-auto bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Checkout</h2>
        <div className="flex items-center">
          <CreditCard className="h-5 w-5 text-gray-500 mr-2" />
          <span className="text-sm text-gray-500">Secure Payment</span>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">{planName}</p>
            <p className="text-sm text-gray-500">Monthly subscription</p>
          </div>
          <p className="text-xl font-bold">${amount}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg mb-6 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Cardholder Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={cardDetails.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-lime-500 focus:border-lime-500"
              placeholder="John Smith"
            />
          </div>

          <div>
            <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">
              Card Number
            </label>
            <input
              id="number"
              name="number"
              type="text"
              required
              value={cardDetails.number}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-lime-500 focus:border-lime-500"
              placeholder="4242 4242 4242 4242"
              maxLength={19}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="expiry" className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date
              </label>
              <input
                id="expiry"
                name="expiry"
                type="text"
                required
                value={cardDetails.expiry}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-lime-500 focus:border-lime-500"
                placeholder="MM/YY"
                maxLength={5}
              />
            </div>

            <div>
              <label htmlFor="cvc" className="block text-sm font-medium text-gray-700 mb-1">
                CVC
              </label>
              <input
                id="cvc"
                name="cvc"
                type="text"
                required
                value={cardDetails.cvc}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-lime-500 focus:border-lime-500"
                placeholder="123"
                maxLength={3}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-6 px-4 py-3 bg-lime-500 text-white rounded-lg hover:bg-lime-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Processing...
            </span>
          ) : (
            `Pay $${amount}`
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          By completing this purchase, you agree to our{" "}
          <a href="/terms" className="text-lime-600 hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-lime-600 hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  )
}
