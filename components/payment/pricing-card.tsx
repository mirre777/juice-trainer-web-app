"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"

interface PricingCardProps {
  name: string
  price: number | string
  currency?: string
  description: string
  features: string[]
  planId: string
  comingSoon?: boolean
  buttonText?: string
  isCurrentPlan?: boolean
}

function PricingCard({
  name,
  price,
  currency = "€",
  description,
  features,
  planId,
  comingSoon = false,
  buttonText = "Get Elite",
  isCurrentPlan = false,
}: PricingCardProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubscribe = () => {
    if (isCurrentPlan) {
      // Do nothing if this is the current plan
      return
    }

    setIsLoading(true)
    // In a real app, you would check if the user is logged in first
    // For demo purposes, we'll use a hardcoded user ID
    const userId = "demo-user-123"

    // Navigate to checkout page with plan details
    router.push(`/checkout?plan=${planId}&price=${price}&name=${encodeURIComponent(name)}&userId=${userId}`)
  }

  return (
    <div
      className={`rounded-lg border ${isCurrentPlan ? "border-[#D2FF28]" : "border-gray-200"} bg-white p-6 shadow-sm flex flex-col h-full`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-black">{name}</h3>
        {isCurrentPlan && (
          <span className="bg-[#D2FF28] text-black text-xs font-medium px-3 py-1 rounded-full">CURRENT PLAN</span>
        )}
        {comingSoon && (
          <span className="bg-gray-200 text-black text-xs font-medium px-3 py-1 rounded-full">COMING SOON</span>
        )}
      </div>

      <div className="flex items-baseline mb-4">
        {price === "Free" ? (
          <span className="text-4xl font-bold text-black">Free</span>
        ) : (
          <>
            <span className="text-4xl font-bold text-black">
              {currency}
              {price}
            </span>
            <span className="ml-1 text-sm text-darkgray">/month</span>
          </>
        )}
      </div>

      <p className="text-sm text-darkgray mb-8">{description}</p>

      <ul className="space-y-4 mb-8 flex-grow">
        {features.map((feature) => (
          <li key={feature} className="flex items-start">
            <Check className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-black">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleSubscribe}
        disabled={isLoading || isCurrentPlan}
        className={`w-full py-3 px-4 rounded-md font-medium transition-colors text-sm mt-auto ${
          isCurrentPlan
            ? "text-black bg-gray-100 cursor-default"
            : "text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
            Processing...
          </span>
        ) : (
          buttonText
        )}
      </button>
    </div>
  )
}

export { PricingCard }
export default PricingCard
