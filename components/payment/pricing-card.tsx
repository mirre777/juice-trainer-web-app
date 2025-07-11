"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"

interface PricingCardProps {
  title: string
  price: number | string
  period?: string
  description: string
  features: string[]
  buttonText?: string
  buttonVariant?: "default" | "outline"
  isPopular?: boolean
  isCurrent?: boolean
  planId: string
  disabled?: boolean
}

export function PricingCard({
  title,
  price,
  period = "month",
  description,
  features,
  buttonText = "Get Started",
  buttonVariant = "default",
  isPopular = false,
  isCurrent = false,
  planId,
  disabled = false,
}: PricingCardProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubscribe = () => {
    if (isCurrent || disabled) {
      return
    }

    setIsLoading(true)
    // Navigate to checkout page with plan details
    router.push(`/checkout?plan=${planId}&price=${price}&name=${encodeURIComponent(title)}`)
  }

  return (
    <div
      className={`rounded-lg border ${
        isPopular ? "border-[#D2FF28] ring-2 ring-[#D2FF28]" : "border-gray-200"
      } ${isCurrent ? "border-[#D2FF28]" : ""} bg-white p-6 shadow-sm flex flex-col h-full relative`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-[#D2FF28] text-black text-xs font-medium px-3 py-1 rounded-full">MOST POPULAR</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-black">{title}</h3>
        {isCurrent && (
          <span className="bg-[#D2FF28] text-black text-xs font-medium px-3 py-1 rounded-full">CURRENT PLAN</span>
        )}
      </div>

      <div className="flex items-baseline mb-4">
        {price === "0" || price === 0 ? (
          <span className="text-4xl font-bold text-black">Free</span>
        ) : (
          <>
            <span className="text-4xl font-bold text-black">€{price}</span>
            <span className="ml-1 text-sm text-gray-600">/{period}</span>
          </>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-8">{description}</p>

      <ul className="space-y-4 mb-8 flex-grow">
        {features.map((feature) => (
          <li key={feature} className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-black">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleSubscribe}
        disabled={isLoading || isCurrent || disabled}
        className={`w-full py-3 px-4 rounded-md font-medium transition-colors text-sm mt-auto ${
          isCurrent
            ? "text-black bg-gray-100 cursor-default"
            : buttonVariant === "outline"
              ? "text-black border border-gray-300 bg-white hover:bg-gray-50"
              : "text-black bg-[#D2FF28] hover:bg-[#D2FF28]/90"
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
